const express = require('express');
const router = express.Router();
const { allAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/data (Full synchronized workspace dataset from SQLite)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companies = await allAsync('SELECT id, name, logo FROM companies ORDER BY id ASC');
    const employees = await allAsync('SELECT * FROM employees ORDER BY id ASC');
    const rawAssets = await allAsync('SELECT * FROM assets ORDER BY id ASC');
    const rawAssignments = await allAsync('SELECT * FROM assignments ORDER BY date DESC, id DESC');
    const rawRequests = await allAsync('SELECT * FROM asset_requests ORDER BY date DESC, id DESC');
    const rawReturnRequests = await allAsync('SELECT * FROM return_requests ORDER BY requested_on DESC, id DESC');
    const rawReturns = await allAsync('SELECT * FROM asset_returns ORDER BY date DESC, id DESC');
    const rawMaintenance = await allAsync('SELECT * FROM maintenance ORDER BY reported DESC, id DESC');
    const logs = await allAsync(
      'SELECT id, action, asset_id as assetId, employee_id as employeeId, description, time, user_email as userEmail FROM audit_logs ORDER BY id DESC'
    );

    const settingsRows = await allAsync('SELECT key, value FROM settings');
    const settings = {
      org: 'ZylloTech Asset Management',
      prefix: 'AST',
      currency: 'INR'
    };
    settingsRows.forEach((r) => {
      settings[r.key] = r.value;
    });

    const assets = rawAssets.map((a) => ({
      ...a,
      price: Number(a.price || 0),
      purchaseDate: a.purchase_date,
      employeeId: a.employee_id || '',
      employeeName: a.employee_name || '',
      image: a.image || '',
      stockNote: a.stock_note || '',
      retirementReason: a.retirement_reason || ''
    }));

    const assignments = rawAssignments.map((x) => ({
      ...x,
      assetId: x.asset_id,
      assetName: x.asset_name,
      employeeId: x.employee_id,
      employeeName: x.employee_name,
      returnDate: x.return_date
    }));

    const requests = rawRequests.map((r) => ({
      ...r,
      employeeId: r.employee_id,
      employeeName: r.employee_name,
      decidedOn: r.decided_on
    }));

    const returnRequests = rawReturnRequests.map((q) => ({
      ...q,
      assetId: q.asset_id,
      assetName: q.asset_name,
      employeeId: q.employee_id,
      employeeName: q.employee_name,
      requestedOn: q.requested_on
    }));

    const returns = rawReturns.map((r) => ({
      ...r,
      assetId: r.asset_id,
      assetName: r.asset_name,
      employeeId: r.employee_id,
      employeeName: r.employee_name
    }));

    const maintenance = rawMaintenance.map((m) => ({
      ...m,
      cost: Number(m.cost || 0),
      assetId: m.asset_id
    }));

    return res.json({
      success: true,
      data: {
        companies,
        employees,
        assets,
        assignments,
        requests,
        returnRequests,
        returns,
        maintenance,
        logs,
        settings
      }
    });
  } catch (err) {
    console.error('Fetch data bundle error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve workspace data.' });
  }
});

module.exports = router;
