const express = require('express');
const router = express.Router();
const { getAsync, allAsync, runAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// GET /api/companies
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companies = await allAsync('SELECT * FROM companies ORDER BY id ASC');

    const withStats = await Promise.all(
      companies.map(async (c) => {
        const empCount = await getAsync('SELECT COUNT(*) as count FROM employees WHERE organization = ?', [c.id]);
        const assetCount = await getAsync('SELECT COUNT(*) as count FROM assets WHERE organization = ?', [c.id]);
        const assigned = await getAsync("SELECT COUNT(*) as count FROM assets WHERE organization = ? AND status = 'Assigned'", [c.id]);
        const available = await getAsync("SELECT COUNT(*) as count FROM assets WHERE organization = ? AND status = 'Available'", [c.id]);
        const maintenance = await getAsync("SELECT COUNT(*) as count FROM assets WHERE organization = ? AND status = 'Under Maintenance'", [c.id]);
        const damaged = await getAsync("SELECT COUNT(*) as count FROM assets WHERE organization = ? AND status = 'Damaged'", [c.id]);
        const valueResult = await getAsync('SELECT SUM(price) as total FROM assets WHERE organization = ?', [c.id]);

        return {
          id: c.id,
          name: c.name,
          logo: c.logo || '',
          employeeCount: empCount ? empCount.count : 0,
          assetCount: assetCount ? assetCount.count : 0,
          assigned: assigned ? assigned.count : 0,
          available: available ? available.count : 0,
          maintenance: maintenance ? maintenance.count : 0,
          damaged: damaged ? damaged.count : 0,
          inventoryValue: valueResult && valueResult.total ? valueResult.total : 0
        };
      })
    );

    return res.json({ success: true, data: withStats });
  } catch (err) {
    console.error('Fetch companies error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve companies.' });
  }
});

// PUT /api/companies/:id (Supports JSON or multipart/form-data upload)
router.put('/:id', authMiddleware, upload.single('logoFile'), async (req, res) => {
  try {
    const { id } = req.params;
    let company = await getAsync('SELECT * FROM companies WHERE id = ?', [id]);
    if (!company) {
      await runAsync('INSERT INTO companies (id, name, logo) VALUES (?, ?, ?)', [id, id, '']);
      company = await getAsync('SELECT * FROM companies WHERE id = ?', [id]);
    }

    let { name = company?.name || id, logo = company?.logo || '' } = req.body;

    // If an image was uploaded via multer, convert to data URL for permanent cloud storage
    if (req.file) {
      const fs = require('fs');
      try {
        const fileData = fs.readFileSync(req.file.path);
        logo = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;
      } catch (e) {
        logo = `/api/documents/file/${req.file.filename}`;
      }
    }

    const finalName = (name || id).trim();
    const finalLogo = logo || '';

    await runAsync('UPDATE companies SET name = ?, logo = ? WHERE id = ?', [finalName, finalLogo, id]);

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Company Profile Updated', '—', '—', `Company ${id} (${finalName}) details updated`, new Date().toISOString(), req.user?.email || 'admin']
    );

    const updated = await getAsync('SELECT * FROM companies WHERE id = ?', [id]);
    return res.json({ success: true, data: updated, message: `${id} details saved.` });
  } catch (err) {
    console.error('Update company error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update company.' });
  }
});

module.exports = router;
