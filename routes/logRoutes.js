const express = require('express');
const router = express.Router();
const { allAsync, runAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const logs = await allAsync('SELECT id, action, asset_id as assetId, employee_id as employeeId, description, time, user_email as userEmail FROM audit_logs ORDER BY id DESC');
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Fetch logs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs.' });
  }
});

// POST /api/logs
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { action, assetId = '—', employeeId = '—', description = '' } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required.' });
    }

    const time = new Date().toISOString();
    const userEmail = req.user?.email || 'system';

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      [action, assetId, employeeId, description, time, userEmail]
    );

    return res.status(201).json({ success: true, message: 'Log recorded.' });
  } catch (err) {
    console.error('Create log error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record audit log.' });
  }
});

module.exports = router;
