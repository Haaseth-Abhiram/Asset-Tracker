const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { getAsync, allAsync, runAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// Configure nodemailer transporter
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// GET /api/requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const requests = await allAsync('SELECT * FROM asset_requests ORDER BY date DESC, id DESC');
    const mapped = requests.map((r) => ({
      ...r,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      decidedOn: r.decided_on
    }));
    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch requests error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve asset requests.' });
  }
});

// POST /api/requests
router.post(
  '/',
  authMiddleware,
  [
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('asset').notEmpty().withMessage('Requested asset is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    try {
      const { employeeId, asset, reason, priority = 'Normal', date = new Date().toISOString().slice(0, 10) } = req.body;

      const emp = await getAsync('SELECT * FROM employees WHERE id = ?', [employeeId]);
      const employeeName = emp ? emp.name : 'Employee';

      const lastReq = await getAsync("SELECT id FROM asset_requests WHERE id LIKE 'REQ-%' ORDER BY id DESC LIMIT 1");
      let nextNum = 1;
      if (lastReq && lastReq.id) {
        const num = parseInt(lastReq.id.split('-')[1], 10);
        if (!isNaN(num)) nextNum = num + 1;
      }
      const id = `REQ-${String(nextNum).padStart(4, '0')}`;

      await runAsync(
        `INSERT INTO asset_requests 
          (id, employee_id, employee_name, asset, reason, date, priority, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employeeId, employeeName, asset, reason, date, priority, 'Pending']
      );

      await runAsync(
        'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['Asset Request Submitted', id, employeeId, `Request for ${asset} by ${employeeName}`, new Date().toISOString(), req.user?.email || 'admin']
      );

      return res.status(201).json({
        success: true,
        data: { id, employeeId, employeeName, asset, reason, date, priority, status: 'Pending' },
        message: 'Request submitted successfully.'
      });
    } catch (err) {
      console.error('Create request error:', err);
      return res.status(500).json({ success: false, error: 'Failed to submit asset request.' });
    }
  }
);

// PUT /api/requests/:id/decision
router.put('/:id/decision', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be Approved or Rejected.' });
    }

    const request = await getAsync('SELECT * FROM asset_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, error: `Request has already been ${request.status.toLowerCase()}.` });
    }

    const decidedOn = new Date().toISOString().slice(0, 10);
    await runAsync('UPDATE asset_requests SET status = ?, decided_on = ? WHERE id = ?', [decision, decidedOn, id]);

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      [
        `Asset Request ${decision}`,
        request.id,
        request.employee_id,
        `${decision} request for ${request.asset} by ${request.employee_name}`,
        new Date().toISOString(),
        req.user?.email || 'admin'
      ]
    );

    return res.json({
      success: true,
      data: { ...request, status: decision, decidedOn },
      message: `${request.employee_name}'s request has been ${decision.toLowerCase()}.`
    });
  } catch (err) {
    console.error('Decide request error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record decision.' });
  }
});

// POST /api/requests/:id/email
router.post('/:id/email', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { to, subject, message } = req.body;

    const request = await getAsync('SELECT * FROM asset_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@zyllotech.com',
        to,
        subject,
        text: message
      });
      return res.json({ success: true, message: 'Email sent successfully via SMTP.' });
    } else {
      // SMTP not configured - provide fallback response
      return res.json({
        success: true,
        isSimulated: true,
        message: 'Email service ready (SMTP credentials not configured in .env). Use default mail application.'
      });
    }
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ success: false, error: 'Failed to dispatch email.' });
  }
});

module.exports = router;
