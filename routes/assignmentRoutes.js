const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync, transactionAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/assignments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search = '' } = req.query;
    let sql = 'SELECT * FROM assignments WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (id LIKE ? OR employee_name LIKE ? OR employee_id LIKE ? OR asset_id LIKE ? OR asset_name LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s, s);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const assignments = await allAsync(sql, params);

    const mapped = assignments.map((x) => ({
      ...x,
      assetId: x.asset_id,
      assetName: x.asset_name,
      employeeId: x.employee_id,
      employeeName: x.employee_name,
      returnDate: x.return_date
    }));

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch assignments error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve assignments.' });
  }
});

// POST /api/assignments
router.post(
  '/',
  authMiddleware,
  [
    body('employeeId').notEmpty().withMessage('Employee selection is required'),
    body('assetIds').notEmpty().withMessage('Asset selection is required'),
    body('date').notEmpty().withMessage('Assignment date is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      const { employeeId, assetIds, date, expected = '', remarks = '' } = req.body;

      // Normalize employee ID (handle "EMP-1001 · John Doe" format)
      const empId = employeeId.includes(' · ') ? employeeId.split(' · ')[0].trim() : employeeId.trim();
      const employee = await getAsync('SELECT * FROM employees WHERE id = ?', [empId]);

      if (!employee) {
        return res.status(404).json({ success: false, error: 'Selected employee not found.' });
      }

      // Parse asset IDs (comma-separated string or array)
      const rawIds = Array.isArray(assetIds) ? assetIds : String(assetIds).split(',');
      const ids = rawIds.map((s) => s.trim()).filter(Boolean);

      if (ids.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one asset ID must be selected.' });
      }

      // Check all assets exist and are Available
      for (const id of ids) {
        const asset = await getAsync('SELECT id, status, name FROM assets WHERE id = ?', [id]);
        if (!asset) {
          return res.status(404).json({ success: false, error: `Asset ${id} does not exist.` });
        }
        if (asset.status !== 'Available') {
          return res.status(400).json({
            success: false,
            error: `Asset ${asset.id} (${asset.name}) is currently '${asset.status}', not Available for assignment.`
          });
        }
      }

      const createdAssignments = [];

      await transactionAsync(async () => {
        let counter = 0;
        for (const id of ids) {
          const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);
          const assignmentId = `ASN-${Date.now() + counter++}`;

          await runAsync(
            `UPDATE assets SET 
              status = 'Assigned', employee_id = ?, employee_name = ?, organization = ? 
             WHERE id = ?`,
            [employee.id, employee.name, employee.organization || 'C1', id]
          );

          await runAsync(
            `INSERT INTO assignments 
              (id, asset_id, asset_name, employee_id, employee_name, department, date, expected, status, remarks) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              assignmentId,
              id,
              asset.name,
              employee.id,
              employee.name,
              employee.department,
              date,
              expected,
              'Active',
              remarks
            ]
          );

          createdAssignments.push({
            id: assignmentId,
            assetId: id,
            assetName: asset.name,
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department,
            date,
            expected,
            status: 'Active',
            remarks
          });
        }
      });

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        [
          'Asset Assigned',
          ids.join(', '),
          employee.id,
          `${ids.length} asset(s) assigned to ${employee.name}`,
          new Date().toISOString(),
          req.user?.email || 'admin'
        ]
      );

      return res.status(201).json({
        success: true,
        data: createdAssignments,
        message: `${ids.length} asset(s) assigned to ${employee.name} successfully.`
      });
    } catch (err) {
      console.error('Assignment error:', err);
      return res.status(500).json({ success: false, error: 'Failed to process asset assignment.' });
    }
  }
);

// POST /api/assignments/transfer
router.post(
  '/transfer',
  authMiddleware,
  [
    body('assetId').notEmpty().withMessage('Asset selection is required'),
    body('employeeId').notEmpty().withMessage('Target employee selection is required'),
    body('date').notEmpty().withMessage('Transfer date is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      let { assetId, employeeId, date, remarks = '' } = req.body;

      if (assetId.includes(' · ')) assetId = assetId.split(' · ')[0].trim();
      if (employeeId.includes(' · ')) employeeId = employeeId.split(' · ')[0].trim();

      const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [assetId]);
      if (!asset || asset.status !== 'Assigned') {
        return res.status(400).json({ success: false, error: 'Selected asset is not currently assigned.' });
      }

      const newEmp = await getAsync('SELECT * FROM employees WHERE id = ?', [employeeId]);
      if (!newEmp) {
        return res.status(404).json({ success: false, error: 'Target employee not found.' });
      }

      const previousEmpId = asset.employee_id;
      const assignmentId = `ASN-${Date.now()}`;

      await transactionAsync(async () => {
        // Mark previous active assignment as Transferred
        await runAsync(
          "UPDATE assignments SET status = 'Transferred', return_date = ?, remarks = ? WHERE asset_id = ? AND status = 'Active'",
          [date, remarks || 'Transferred to another employee', asset.id]
        );

        // Update asset employee
        await runAsync(
          `UPDATE assets SET 
            employee_id = ?, employee_name = ?, organization = ? 
           WHERE id = ?`,
          [newEmp.id, newEmp.name, newEmp.organization || 'C1', asset.id]
        );

        // Create new assignment
        await runAsync(
          `INSERT INTO assignments 
            (id, asset_id, asset_name, employee_id, employee_name, department, date, status, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [assignmentId, asset.id, asset.name, newEmp.id, newEmp.name, newEmp.department, date, 'Active', remarks]
        );
      });

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        [
          'Asset Transferred',
          asset.id,
          `${previousEmpId} → ${newEmp.id}`,
          `Transferred from ${asset.employee_name || previousEmpId} to ${newEmp.name}`,
          new Date().toISOString(),
          req.user?.email || 'admin'
        ]
      );

      return res.json({
        success: true,
        message: `Asset ${asset.id} transferred to ${newEmp.name} successfully.`
      });
    } catch (err) {
      console.error('Transfer error:', err);
      return res.status(500).json({ success: false, error: 'Failed to process asset transfer.' });
    }
  }
);

module.exports = router;
