const express = require('express');
const router = express.Router();
const { getAsync, allAsync, runAsync } = require('../database/database');
const { seedDatabase } = require('../database/seed');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/roleMiddleware');

// GET /api/settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const settingsRows = await allAsync('SELECT key, value FROM settings');
    const settings = {
      org: 'ZylloTech Asset Management',
      prefix: 'AST',
      currency: 'INR'
    };

    settingsRows.forEach((row) => {
      settings[row.key] = row.value;
    });

    const empCount = await getAsync('SELECT COUNT(*) as count FROM employees');
    const assetCount = await getAsync('SELECT COUNT(*) as count FROM assets');
    const available = await getAsync("SELECT COUNT(*) as count FROM assets WHERE status = 'Available'");
    const assigned = await getAsync("SELECT COUNT(*) as count FROM assets WHERE status = 'Assigned'");
    const maintenance = await getAsync("SELECT COUNT(*) as count FROM assets WHERE status = 'Under Maintenance'");

    return res.json({
      success: true,
      data: {
        settings,
        stats: {
          employees: empCount ? empCount.count : 0,
          assets: assetCount ? assetCount.count : 0,
          available: available ? available.count : 0,
          assigned: assigned ? assigned.count : 0,
          maintenance: maintenance ? maintenance.count : 0
        }
      }
    });
  } catch (err) {
    console.error('Fetch settings error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { org, prefix } = req.body;

    if (org) {
      await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['org', org.trim()]);
    }
    if (prefix) {
      await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['prefix', prefix.trim().toUpperCase()]);
    }

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Settings Updated', '—', '—', 'Organization preferences saved', new Date().toISOString(), req.user?.email || 'admin']
    );

    return res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update settings.' });
  }
});

// GET /api/settings/backup (Export complete JSON backup)
router.get('/backup', authMiddleware, async (req, res) => {
  try {
    const companies = await allAsync('SELECT id, name, logo FROM companies');
    const employees = await allAsync('SELECT * FROM employees');
    const rawAssets = await allAsync('SELECT * FROM assets');
    const rawAssignments = await allAsync('SELECT * FROM assignments');
    const rawRequests = await allAsync('SELECT * FROM asset_requests');
    const rawReturnRequests = await allAsync('SELECT * FROM return_requests');
    const rawReturns = await allAsync('SELECT * FROM asset_returns');
    const rawMaintenance = await allAsync('SELECT * FROM maintenance');
    const logs = await allAsync('SELECT action, asset_id as assetId, employee_id as employeeId, time, description FROM audit_logs ORDER BY id DESC');

    const settingsRows = await allAsync('SELECT key, value FROM settings');
    const settings = {};
    settingsRows.forEach((r) => {
      settings[r.key] = r.value;
    });

    const assets = rawAssets.map((a) => ({
      ...a,
      purchaseDate: a.purchase_date,
      employeeId: a.employee_id || '',
      employeeName: a.employee_name || '',
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
      assetId: m.asset_id
    }));

    const backupData = {
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
    };

    res.setHeader('Content-Disposition', 'attachment; filename=assetflow-backup.json');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    console.error('Backup error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate backup.' });
  }
});

// POST /api/settings/reset (Restore initial records)
router.post('/reset', authMiddleware, roleMiddleware(['Administrator']), async (req, res) => {
  try {
    await seedDatabase(true);
    return res.json({ success: true, message: 'Workspace records restored to initial demo state.' });
  } catch (err) {
    console.error('Reset error:', err);
    return res.status(500).json({ success: false, error: 'Failed to restore initial records.' });
  }
});

module.exports = router;
