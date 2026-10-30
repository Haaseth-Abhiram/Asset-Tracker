const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync, transactionAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// GET /api/employees
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search = '', organization = '', status = '', department = '' } = req.query;

    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (id LIKE ? OR name LIKE ? OR email LIKE ? OR department LIKE ? OR organization LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    if (organization && organization !== 'All organizations') {
      sql += ' AND organization = ?';
      params.push(organization);
    }

    if (status && status !== 'All statuses') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (department) {
      sql += ' AND department = ?';
      params.push(department);
    }

    sql += ' ORDER BY id ASC';

    const employees = await allAsync(sql, params);
    return res.json({ success: true, data: employees });
  } catch (err) {
    console.error('Fetch employees error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve employees.' });
  }
});

// GET /api/employees/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    const assignedAssets = await allAsync(
      "SELECT * FROM assets WHERE employee_id = ? AND status = 'Assigned' ORDER BY id ASC",
      [id]
    );

    const history = await allAsync(
      'SELECT * FROM assignments WHERE employee_id = ? ORDER BY date DESC, id DESC',
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...employee,
        assignedAssets,
        history
      }
    });
  } catch (err) {
    console.error('Fetch employee detail error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve employee details.' });
  }
});

// POST /api/employees
router.post(
  '/',
  authMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Employee name is required'),
    body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
    body('organization').notEmpty().withMessage('Organization is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('designation').trim().notEmpty().withMessage('Designation is required')
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
        organization = 'C1',
        email,
        phone = '',
        department,
        designation,
        joined = new Date().toISOString().slice(0, 10),
        status = 'Active',
        location = 'Hyderabad'
      } = req.body;

      email = email.toLowerCase().trim();

      // Check unique email
      const existingEmail = await getAsync('SELECT id FROM employees WHERE email = ?', [email]);
      if (existingEmail) {
        return res.status(409).json({ success: false, error: 'An employee with this email already exists.' });
      }

      // If id not provided or auto-generate
      if (!id) {
        const lastEmp = await getAsync("SELECT id FROM employees WHERE id LIKE 'EMP-%' ORDER BY id DESC LIMIT 1");
        let nextNum = 1001;
        if (lastEmp && lastEmp.id) {
          const num = parseInt(lastEmp.id.split('-')[1], 10);
          if (!isNaN(num)) nextNum = num + 1;
        }
        id = `EMP-${nextNum}`;
      } else {
        const existingId = await getAsync('SELECT id FROM employees WHERE id = ?', [id]);
        if (existingId) {
          return res.status(409).json({ success: false, error: 'Duplicate employee ID. Use a unique ID.' });
        }
      }

      await runAsync(
        `INSERT INTO employees 
          (id, organization, name, email, phone, department, designation, joined, status, location) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, organization, name.trim(), email, phone.trim(), department, designation.trim(), joined, status, location]
      );

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Employee Added', '—', id, `${name} profile saved`, new Date().toISOString(), req.user?.email || 'admin']
      );

      const created = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);
      return res.status(201).json({ success: true, data: created, message: 'Employee created successfully.' });
    } catch (err) {
      console.error('Create employee error:', err);
      return res.status(500).json({ success: false, error: 'Failed to create employee.' });
    }
  }
);

// PUT /api/employees/:id
router.put(
  '/:id',
  authMiddleware,
  [
    body('name').optional().trim().notEmpty().withMessage('Employee name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email address is required').normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      const { id } = req.params;
      const existing = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Employee not found.' });
      }

      const {
        name = existing.name,
        organization = existing.organization,
        email = existing.email,
        phone = existing.phone,
        department = existing.department,
        designation = existing.designation,
        joined = existing.joined,
        status = existing.status,
        location = existing.location
      } = req.body;

      const normalizedEmail = email.toLowerCase().trim();

      // Check unique email if changed
      if (normalizedEmail !== existing.email.toLowerCase()) {
        const duplicate = await getAsync('SELECT id FROM employees WHERE email = ? AND id != ?', [normalizedEmail, id]);
        if (duplicate) {
          return res.status(409).json({ success: false, error: 'Another employee already uses this email.' });
        }
      }

      await transactionAsync(async () => {
        await runAsync(
          `UPDATE employees SET 
            organization = ?, name = ?, email = ?, phone = ?, department = ?, 
            designation = ?, joined = ?, status = ?, location = ? 
           WHERE id = ?`,
          [organization, name.trim(), normalizedEmail, phone.trim(), department, designation.trim(), joined, status, location, id]
        );

        // Update assigned assets & assignments cache
        await runAsync('UPDATE assets SET employee_name = ?, organization = ? WHERE employee_id = ?', [name.trim(), organization, id]);
        await runAsync('UPDATE assignments SET employee_name = ?, department = ? WHERE employee_id = ?', [name.trim(), department, id]);
      });

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Employee Edited', '—', id, `${name} profile updated`, new Date().toISOString(), req.user?.email || 'admin']
      );

      const updated = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);
      return res.json({ success: true, data: updated, message: 'Employee updated successfully.' });
    } catch (err) {
      console.error('Update employee error:', err);
      return res.status(500).json({ success: false, error: 'Failed to update employee.' });
    }
  }
);

// DELETE /api/employees/:id (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['Administrator']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    await transactionAsync(async () => {
      // Unassign any assigned assets so they become Available
      await runAsync(
        "UPDATE assets SET status = 'Available', employee_id = NULL, employee_name = NULL WHERE employee_id = ?",
        [id]
      );
      // Mark active assignments as Returned
      await runAsync(
        "UPDATE assignments SET status = 'Returned', return_date = ? WHERE employee_id = ? AND status = 'Active'",
        [new Date().toISOString().slice(0, 10), id]
      );
      // Delete employee
      await runAsync('DELETE FROM employees WHERE id = ?', [id]);
    });

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Record Deleted', '—', id, `Employee ${existing.name} (${id}) deleted`, new Date().toISOString(), req.user?.email || 'admin']
    );

    return res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete employee.' });
  }
});

module.exports = router;
