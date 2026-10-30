const express = require('express');
const router = express.Router();
const { allAsync, runAsync, getAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/departments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const departments = await allAsync('SELECT * FROM departments ORDER BY name ASC');

    const stats = await Promise.all(
      departments.map(async (d) => {
        const empCount = await getAsync(
          'SELECT COUNT(*) as count FROM employees WHERE department = ?',
          [d.name]
        );
        const assignedAssetsCount = await getAsync(
          `SELECT COUNT(*) as count FROM assets a 
           JOIN employees e ON a.employee_id = e.id 
           WHERE e.department = ? AND a.status = 'Assigned'`,
          [d.name]
        );

        return {
          id: d.id,
          name: d.name,
          employeeCount: empCount ? empCount.count : 0,
          assignedCount: assignedAssetsCount ? assignedAssetsCount.count : 0
        };
      })
    );

    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Fetch departments error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve departments.' });
  }
});

// POST /api/departments
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Department name is required.' });
    }

    const trimmed = name.trim();
    const existing = await getAsync('SELECT id FROM departments WHERE name = ?', [trimmed]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Department already exists.' });
    }

    await runAsync('INSERT INTO departments (name) VALUES (?)', [trimmed]);
    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Department Added', '—', '—', trimmed, new Date().toISOString(), req.user?.email || 'admin']
    );

    return res.status(201).json({ success: true, message: 'Department added successfully.' });
  } catch (err) {
    console.error('Create department error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create department.' });
  }
});

module.exports = router;
