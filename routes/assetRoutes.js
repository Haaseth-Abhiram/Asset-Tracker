const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync, transactionAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// GET /api/assets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search = '', status = '', category = '', organization = '' } = req.query;

    let sql = 'SELECT * FROM assets WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (id LIKE ? OR name LIKE ? OR serial LIKE ? OR category LIKE ? OR brand LIKE ? OR model LIKE ? OR employee_name LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s, s, s);
    }

    if (status && status !== 'All statuses') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (category && category !== 'All categories') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (organization && organization !== 'All organizations') {
      sql += ' AND organization = ?';
      params.push(organization);
    }

    sql += ' ORDER BY id ASC';

    const assets = await allAsync(sql, params);

    // Map column names to camelCase for frontend compatibility if needed
    const mapped = assets.map((a) => ({
      ...a,
      purchaseDate: a.purchase_date,
      employeeId: a.employee_id || '',
      employeeName: a.employee_name || '',
      image: a.image || '',
      stockNote: a.stock_note || '',
      retirementReason: a.retirement_reason || ''
    }));

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch assets error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve assets.' });
  }
});

// GET /api/assets/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found.' });
    }

    const assignments = await allAsync('SELECT * FROM assignments WHERE asset_id = ? ORDER BY date DESC', [id]);
    const maintenance = await allAsync('SELECT * FROM maintenance WHERE asset_id = ? ORDER BY reported DESC', [id]);

    const mapped = {
      ...asset,
      purchaseDate: asset.purchase_date,
      employeeId: asset.employee_id || '',
      employeeName: asset.employee_name || '',
      image: asset.image || '',
      stockNote: asset.stock_note || '',
      retirementReason: asset.retirement_reason || '',
      assignments,
      maintenance
    };

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch asset detail error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve asset details.' });
  }
});

// POST /api/assets
router.post(
  '/',
  authMiddleware,
  upload.single('imageFile'),
  [
    body('name').trim().notEmpty().withMessage('Asset name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('serial').trim().notEmpty().withMessage('Serial number is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      let {
        id,
        name,
        category,
        brand,
        model = '',
        serial,
        purchaseDate = new Date().toISOString().slice(0, 10),
        price = 0,
        vendor = '',
        warranty = '',
        location = 'Hyderabad',
        condition = 'Good',
        status = 'Available',
        organization = 'C1',
        image = '',
        stockNote = '',
        employeeId = '',
        employeeName = ''
      } = req.body;

      if (req.file) {
        image = `/api/documents/file/${req.file.filename}`;
      }

      serial = serial.trim().toUpperCase();

      // Check serial uniqueness
      const existingSerial = await getAsync('SELECT id FROM assets WHERE serial = ?', [serial]);
      if (existingSerial) {
        return res.status(409).json({ success: false, error: `Serial number ${serial} already exists.` });
      }

      // Generate ID if missing
      if (!id) {
        const prefixSetting = await getAsync("SELECT value FROM settings WHERE key = 'prefix'");
        const prefix = prefixSetting ? prefixSetting.value : 'AST';
        const cleanPrefix = (prefix || 'AST').replace(/[-_]+$/, '').trim().toUpperCase() || 'AST';

        const allAssets = await allAsync("SELECT id FROM assets");
        const existingIdSet = new Set(allAssets.map(a => a.id ? a.id.trim() : ''));

        let maxNum = 0;
        for (const a of allAssets) {
          if (a.id) {
            const match = a.id.match(/\d+$/);
            if (match) {
              const n = parseInt(match[0], 10);
              if (!isNaN(n) && n > maxNum) maxNum = n;
            }
          }
        }

        let nextNum = maxNum + 1;
        let candidateId = `${cleanPrefix}-${String(nextNum).padStart(4, '0')}`;
        while (existingIdSet.has(candidateId)) {
          nextNum++;
          candidateId = `${cleanPrefix}-${String(nextNum).padStart(4, '0')}`;
        }
        id = candidateId;
      } else {
        const existingId = await getAsync('SELECT id FROM assets WHERE id = ?', [id]);
        if (existingId) {
          return res.status(409).json({ success: false, error: 'Duplicate asset ID. Use a unique ID.' });
        }
      }

      await runAsync(
        `INSERT INTO assets 
          (id, name, category, brand, model, serial, purchase_date, price, vendor, warranty, location, condition, status, organization, image, stock_note, employee_id, employee_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name.trim(),
          category.trim(),
          brand.trim(),
          model.trim(),
          serial,
          purchaseDate,
          Number(price) || 0,
          vendor.trim(),
          warranty,
          location.trim(),
          condition,
          status,
          organization,
          image || '',
          stockNote,
          employeeId || null,
          employeeName || null
        ]
      );

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Asset Added', id, '—', `${name} saved to inventory`, new Date().toISOString(), req.user?.email || 'admin']
      );

      const created = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);
      return res.status(201).json({
        success: true,
        data: {
          ...created,
          purchaseDate: created.purchase_date,
          employeeId: created.employee_id || '',
          employeeName: created.employee_name || '',
          image: created.image || ''
        },
        message: 'Asset created successfully.'
      });
    } catch (err) {
      console.error('Create asset error:', err);
      return res.status(500).json({ success: false, error: 'Failed to create asset.' });
    }
  }
);

// PUT /api/assets/:id
router.put(
  '/:id',
  authMiddleware,
  upload.single('imageFile'),
  [
    body('name').optional().trim().notEmpty().withMessage('Asset name cannot be empty'),
    body('serial').optional().trim().notEmpty().withMessage('Serial number cannot be empty')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      const { id } = req.params;
      const existing = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Asset not found.' });
      }

      let {
        name = existing.name,
        category = existing.category,
        brand = existing.brand,
        model = existing.model,
        serial = existing.serial,
        purchaseDate = existing.purchase_date,
        price = existing.price,
        vendor = existing.vendor,
        warranty = existing.warranty,
        location = existing.location,
        condition = existing.condition,
        status = existing.status,
        organization = existing.organization,
        employeeId = existing.employee_id,
        employeeName = existing.employee_name,
        image = existing.image,
        stockNote = existing.stock_note,
        retirementReason = existing.retirement_reason
      } = req.body;

      if (req.file) {
        image = `/api/documents/file/${req.file.filename}`;
      } else if (image === undefined) {
        image = existing.image || '';
      }

      const normalizedSerial = (serial || existing.serial).trim().toUpperCase();

      if (normalizedSerial !== existing.serial) {
        const dupSerial = await getAsync('SELECT id FROM assets WHERE serial = ? AND id != ?', [normalizedSerial, id]);
        if (dupSerial) {
          return res.status(409).json({ success: false, error: `Serial ${normalizedSerial} already belongs to another asset.` });
        }
      }

      await runAsync(
        `UPDATE assets SET 
          name = ?, category = ?, brand = ?, model = ?, serial = ?, purchase_date = ?, 
          price = ?, vendor = ?, warranty = ?, location = ?, condition = ?, status = ?, 
          organization = ?, employee_id = ?, employee_name = ?, image = ?, stock_note = ?, retirement_reason = ? 
         WHERE id = ?`,
        [
          name.trim(),
          category,
          brand.trim(),
          model.trim(),
          normalizedSerial,
          purchaseDate,
          Number(price) || 0,
          vendor.trim(),
          warranty,
          location.trim(),
          condition,
          status,
          organization,
          employeeId || null,
          employeeName || null,
          image || '',
          stockNote,
          retirementReason,
          id
        ]
      );

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Asset Edited', id, employeeId || '—', `${name} updated in inventory`, new Date().toISOString(), req.user?.email || 'admin']
      );

      const updated = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);
      return res.json({
        success: true,
        data: {
          ...updated,
          purchaseDate: updated.purchase_date,
          employeeId: updated.employee_id || '',
          employeeName: updated.employee_name || '',
          image: updated.image || ''
        },
        message: 'Asset updated successfully.'
      });
    } catch (err) {
      console.error('Update asset error:', err);
      return res.status(500).json({ success: false, error: 'Failed to update asset.' });
    }
  }
);

// DELETE /api/assets/:id (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['Administrator']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Asset not found.' });
    }

    await transactionAsync(async () => {
      await runAsync('DELETE FROM assignments WHERE asset_id = ?', [id]);
      await runAsync('DELETE FROM maintenance WHERE asset_id = ?', [id]);
      await runAsync('DELETE FROM return_requests WHERE asset_id = ?', [id]);
      await runAsync('DELETE FROM asset_returns WHERE asset_id = ?', [id]);
      await runAsync('DELETE FROM assets WHERE id = ?', [id]);
    });

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Record Deleted', id, '—', `Asset ${existing.name} (${id}) deleted`, new Date().toISOString(), req.user?.email || 'admin']
    );

    return res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (err) {
    console.error('Delete asset error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete asset.' });
  }
});

module.exports = router;
