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
        const allEmps = await allAsync("SELECT id FROM employees");
        const empIdSet = new Set(allEmps.map(e => e.id ? e.id.trim() : ''));
        let maxNum = 1000;
        for (const e of allEmps) {
          if (e.id) {
            const match = e.id.match(/\d+$/);
            if (match) {
              const n = parseInt(match[0], 10);
              if (!isNaN(n) && n > maxNum) maxNum = n;
            }
          }
        }
        let nextNum = maxNum + 1;
        let candidateId = `EMP-${nextNum}`;
        while (empIdSet.has(candidateId)) {
          nextNum++;
          candidateId = `EMP-${nextNum}`;
        }
        id = candidateId;
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
      let existing = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);

      const {
        name,
        organization,
        email,
        phone,
        department,
        designation,
        joined,
        status,
        location
      } = req.body;

      if (!existing) {
        // If employee doesn't exist yet in SQLite (e.g. from local frontend seed), insert first so update succeeds
        const cleanName = (name || id).trim();
        const cleanEmail = (email || `${id.toLowerCase()}@gmail.com`).toLowerCase().trim();
        await runAsync(
          `INSERT INTO employees (id, organization, name, email, phone, department, designation, joined, status, location)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            organization || 'C1',
            cleanName,
            cleanEmail,
            (phone || '').trim(),
            department || 'Development',
            (designation || 'Staff').trim(),
            joined || new Date().toISOString().slice(0, 10),
            status || 'Active',
            location || 'Hyderabad'
          ]
        );
        existing = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);
      }

      const finalName = (name !== undefined ? name : existing.name).trim();
      const finalOrg = organization !== undefined ? organization : existing.organization;
      const finalEmail = (email !== undefined ? email : existing.email).toLowerCase().trim();
      const finalPhone = (phone !== undefined ? phone : (existing.phone || '')).trim();
      const finalDept = department !== undefined ? department : existing.department;
      const finalDesignation = (designation !== undefined ? designation : existing.designation).trim();
      const finalJoined = joined !== undefined ? joined : existing.joined;
      const finalStatus = status !== undefined ? status : existing.status;
      const finalLocation = location !== undefined ? location : existing.location;

      // Check unique email if changed
      if (finalEmail !== existing.email.toLowerCase()) {
        const duplicate = await getAsync('SELECT id FROM employees WHERE email = ? AND id != ?', [finalEmail, id]);
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
          [finalOrg, finalName, finalEmail, finalPhone, finalDept, finalDesignation, finalJoined, finalStatus, finalLocation, id]
        );

        // Update assigned assets & assignments cache
        await runAsync('UPDATE assets SET employee_name = ?, organization = ? WHERE employee_id = ?', [finalName, finalOrg, id]);
        await runAsync('UPDATE assignments SET employee_name = ?, department = ? WHERE employee_id = ?', [finalName, finalDept, id]);
        await runAsync('UPDATE asset_requests SET employee_name = ? WHERE employee_id = ?', [finalName, id]);
        await runAsync('UPDATE return_requests SET employee_name = ? WHERE employee_id = ?', [finalName, id]);
        await runAsync('UPDATE asset_returns SET employee_name = ? WHERE employee_id = ?', [finalName, id]);

        // If a linked user account exists with the same email, update user name as well
        await runAsync('UPDATE users SET name = ? WHERE LOWER(email) = ?', [finalName, finalEmail]);
      });

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Employee Edited', '—', id, `${finalName} profile updated`, new Date().toISOString(), req.user?.email || 'admin']
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
