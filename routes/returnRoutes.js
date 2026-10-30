const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync, transactionAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/returns (return history)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const returns = await allAsync('SELECT * FROM asset_returns ORDER BY date DESC, id DESC');
    const mapped = returns.map((r) => ({
      ...r,
      assetId: r.asset_id,
      assetName: r.asset_name,
      employeeId: r.employee_id,
      employeeName: r.employee_name
    }));
    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch returns error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve return history.' });
  }
});

// POST /api/returns (process return)
router.post(
  '/',
  authMiddleware,
  [
    body('assetId').notEmpty().withMessage('Asset selection is required'),
    body('date').notEmpty().withMessage('Return date is required'),
    body('condition').notEmpty().withMessage('Condition inspection is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      let { assetId, date, condition, remarks = '' } = req.body;
      if (assetId.includes(' · ')) assetId = assetId.split(' · ')[0].trim();

      const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [assetId]);
      if (!asset || asset.status !== 'Assigned') {
        return res.status(400).json({ success: false, error: 'Selected asset is not currently assigned.' });
      }

      const returnStatus = condition === 'Damaged' ? 'Damaged' : condition === 'Poor' ? 'Under Maintenance' : 'Available';
      const returnId = `RET-${Date.now()}`;
      const oldEmpId = asset.employee_id;
      const oldEmpName = asset.employee_name || '';

      await transactionAsync(async () => {
        // Update asset
        await runAsync(
          'UPDATE assets SET condition = ?, status = ?, employee_id = NULL, employee_name = NULL WHERE id = ?',
          [condition, returnStatus, asset.id]
        );

        // Update active assignment
        await runAsync(
          "UPDATE assignments SET status = 'Returned', return_date = ? WHERE asset_id = ? AND status = 'Active'",
          [date, asset.id]
        );

        // Record physical return
        await runAsync(
          `INSERT INTO asset_returns 
            (id, asset_id, asset_name, employee_id, employee_name, date, condition, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [returnId, asset.id, asset.name, oldEmpId, oldEmpName, date, condition, remarks]
        );

        // Mark any pending return request as Completed
        await runAsync(
          "UPDATE return_requests SET status = 'Completed', remarks = ? WHERE asset_id = ? AND status != 'Completed'",
          [remarks || 'Return inspected and completed', asset.id]
        );
      });

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        [
          'Asset Returned',
          asset.id,
          oldEmpId,
          remarks || `Returned in ${condition} condition. Marked ${returnStatus}.`,
          new Date().toISOString(),
          req.user?.email || 'admin'
        ]
      );

      return res.status(201).json({
        success: true,
        message: `Asset ${asset.id} (${asset.name}) successfully returned.`
      });
    } catch (err) {
      console.error('Process return error:', err);
      return res.status(500).json({ success: false, error: 'Failed to process asset return.' });
    }
  }
);

// GET /api/return-requests
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await allAsync('SELECT * FROM return_requests ORDER BY requested_on DESC, id DESC');
    const mapped = requests.map((q) => ({
      ...q,
      assetId: q.asset_id,
      assetName: q.asset_name,
      employeeId: q.employee_id,
      employeeName: q.employee_name,
      requestedOn: q.requested_on
    }));
    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch return requests error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve return requests.' });
  }
});

// POST /api/return-requests
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    let { assetId } = req.body;
    if (assetId.includes(' · ')) assetId = assetId.split(' · ')[0].trim();

    const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!asset || asset.status !== 'Assigned') {
      return res.status(400).json({ success: false, error: 'This asset is no longer assigned.' });
    }

    const existingPending = await getAsync(
      "SELECT id FROM return_requests WHERE asset_id = ? AND status = 'Requested'",
      [asset.id]
    );
    if (existingPending) {
      return res.status(409).json({ success: false, error: 'A return request is already pending for this asset.' });
    }

    const employee = await getAsync('SELECT * FROM employees WHERE id = ?', [asset.employee_id]);
    const requestId = `RRQ-${Date.now()}`;
    const requestedOn = new Date().toLocaleDateString('en-IN');

    await runAsync(
      `INSERT INTO return_requests 
        (id, asset_id, asset_name, employee_id, employee_name, requested_on, status, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        asset.id,
        asset.name,
        asset.employee_id,
        employee?.name || asset.employee_name,
        requestedOn,
        'Requested',
        ''
      ]
    );

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'Asset Return Requested',
        asset.id,
        asset.employee_id,
        `Return requested from ${employee?.name || asset.employee_name}`,
        new Date().toISOString(),
        req.user?.email || 'admin'
      ]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: requestId,
        assetId: asset.id,
        assetName: asset.name,
        employeeId: asset.employee_id,
        employeeName: employee?.name || asset.employee_name,
        requestedOn,
        status: 'Requested'
      },
      message: `Return request recorded for ${employee?.name || asset.employee_name}.`
    });
  } catch (err) {
    console.error('Create return request error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create return request.' });
  }
});

// PUT /api/return-requests/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks = '' } = req.body;

    const request = await getAsync('SELECT * FROM return_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Return request not found.' });
    }

    const prior = request.status;
    await runAsync('UPDATE return_requests SET status = ?, remarks = ? WHERE id = ?', [status, remarks, id]);

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'Return Request Updated',
        request.asset_id,
        request.employee_id,
        `Request status changed from ${prior} to ${status}`,
        new Date().toISOString(),
        req.user?.email || 'admin'
      ]
    );

    return res.json({ success: true, message: 'Return request updated successfully.' });
  } catch (err) {
    console.error('Update return request error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update return request.' });
  }
});

module.exports = router;
