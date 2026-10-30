const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync, transactionAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/maintenance
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cases = await allAsync('SELECT * FROM maintenance ORDER BY reported DESC, id DESC');
    const mapped = cases.map((m) => ({
      ...m,
      assetId: m.asset_id
    }));
    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch maintenance error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve maintenance records.' });
  }
});

// POST /api/maintenance
router.post(
  '/',
  authMiddleware,
  [
    body('assetId').notEmpty().withMessage('Asset selection is required'),
    body('issue').trim().notEmpty().withMessage('Issue description is required'),
    body('reported').notEmpty().withMessage('Reported date is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      let { assetId, issue, reported, provider = '', cost = 0, status = 'Reported', remarks = '' } = req.body;
      if (assetId.includes(' · ')) assetId = assetId.split(' · ')[0].trim();

      const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [assetId]);
      if (!asset) {
        return res.status(404).json({ success: false, error: 'Selected asset not found.' });
      }

      const id = `MNT-${Date.now()}`;

      await transactionAsync(async () => {
        await runAsync(
          `INSERT INTO maintenance 
            (id, asset_id, issue, reported, provider, cost, status, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, asset.id, issue.trim(), reported, provider.trim(), Number(cost) || 0, status, remarks]
        );

        if (status !== 'Completed') {
          await runAsync("UPDATE assets SET status = 'Under Maintenance' WHERE id = ?", [asset.id]);
        }
      });

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Maintenance Logged', asset.id, '—', issue.trim(), new Date().toISOString(), req.user?.email || 'admin']
      );

      return res.status(201).json({
        success: true,
        data: { id, assetId: asset.id, issue, reported, provider, cost, status, remarks },
        message: 'Maintenance case logged successfully.'
      });
    } catch (err) {
      console.error('Create maintenance error:', err);
      return res.status(500).json({ success: false, error: 'Failed to log maintenance case.' });
    }
  }
);

// PUT /api/maintenance/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getAsync('SELECT * FROM maintenance WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Maintenance record not found.' });
    }

    const {
      issue = existing.issue,
      reported = existing.reported,
      provider = existing.provider,
      cost = existing.cost,
      status = existing.status,
      remarks = existing.remarks
    } = req.body;

    await transactionAsync(async () => {
      await runAsync(
        `UPDATE maintenance SET 
          issue = ?, reported = ?, provider = ?, cost = ?, status = ?, remarks = ? 
         WHERE id = ?`,
        [issue, reported, provider, Number(cost) || 0, status, remarks, id]
      );

      // If marked Completed, return asset to Available if it was Under Maintenance
      if (status === 'Completed') {
        const asset = await getAsync('SELECT id, status FROM assets WHERE id = ?', [existing.asset_id]);
        if (asset && asset.status === 'Under Maintenance') {
          await runAsync("UPDATE assets SET status = 'Available' WHERE id = ?", [asset.id]);
        }
      } else if (status === 'In Progress' || status === 'Reported' || status === 'Waiting for Parts') {
        await runAsync("UPDATE assets SET status = 'Under Maintenance' WHERE id = ?", [existing.asset_id]);
      }
    });

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Maintenance Updated', existing.asset_id, '—', `Case ${id} status set to ${status}`, new Date().toISOString(), req.user?.email || 'admin']
    );

    return res.json({ success: true, message: 'Maintenance record updated successfully.' });
  } catch (err) {
    console.error('Update maintenance error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update maintenance record.' });
  }
});

module.exports = router;
