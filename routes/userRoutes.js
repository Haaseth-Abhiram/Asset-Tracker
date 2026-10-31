const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// GET /api/users (Admin only)
router.get('/', authMiddleware, roleMiddleware(['Administrator']), async (req, res) => {
  try {
    const users = await allAsync('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('Fetch users error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve users.' });
  }
});

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getAsync('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/users/profile
router.put(
  '/profile',
  authMiddleware,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      const { name, password } = req.body;
      const updates = [];
      const params = [];

      if (name) {
        updates.push('name = ?');
        params.push(name.trim());
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        params.push(hashedPassword);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update.' });
      }

      params.push(req.user.id);
      await runAsync(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

      const updatedUser = await getAsync('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);

      if (name && updatedUser?.email) {
        const cleanName = name.trim();
        const cleanEmail = updatedUser.email.toLowerCase().trim();
        await runAsync('UPDATE employees SET name = ? WHERE LOWER(email) = ?', [cleanName, cleanEmail]);
        await runAsync('UPDATE assets SET employee_name = ? WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)', [cleanName, cleanEmail]);
        await runAsync('UPDATE assignments SET employee_name = ? WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)', [cleanName, cleanEmail]);
        await runAsync('UPDATE asset_requests SET employee_name = ? WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)', [cleanName, cleanEmail]);
        await runAsync('UPDATE return_requests SET employee_name = ? WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)', [cleanName, cleanEmail]);
        await runAsync('UPDATE asset_returns SET employee_name = ? WHERE employee_id IN (SELECT id FROM employees WHERE LOWER(email) = ?)', [cleanName, cleanEmail]);
      }

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Profile Updated', '—', '—', `User ${updatedUser.name} updated profile details`, new Date().toISOString(), req.user.email]
      );

      return res.json({ success: true, data: updatedUser, message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ success: false, error: 'Failed to update profile.' });
    }
  }
);

module.exports = router;
