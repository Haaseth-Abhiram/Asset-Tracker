const express = require('express');
const router = express.Router();
const { allAsync, getAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/reports/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const totalAssets = await getAsync('SELECT COUNT(*) as count FROM assets');
    const assignedAssets = await getAsync("SELECT COUNT(*) as count FROM assets WHERE status = 'Assigned'");
    const availableAssets = await getAsync("SELECT COUNT(*) as count FROM assets WHERE status = 'Available'");
    const maintenanceAssets = await getAsync("SELECT COUNT(*) as count FROM assets WHERE status = 'Under Maintenance'");
    const totalValue = await getAsync('SELECT SUM(price) as total FROM assets');
    const totalEmployees = await getAsync('SELECT COUNT(*) as count FROM employees');
    const activeEmployees = await getAsync("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'");
    const openMaintenance = await getAsync("SELECT COUNT(*) as count FROM maintenance WHERE status != 'Completed'");

    const categories = await allAsync('SELECT name FROM categories ORDER BY name ASC');
    const categoryStats = await Promise.all(
      categories.map(async (c) => {
        const total = await getAsync('SELECT COUNT(*) as count FROM assets WHERE category = ?', [c.name]);
        const assigned = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Assigned'", [c.name]);
        const available = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Available'", [c.name]);
        const maintenance = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Under Maintenance'", [c.name]);

        return {
          category: c.name,
          total: total ? total.count : 0,
          assigned: assigned ? assigned.count : 0,
          available: available ? available.count : 0,
          maintenance: maintenance ? maintenance.count : 0
        };
      })
    );

    return res.json({
      success: true,
      data: {
        totalAssets: totalAssets ? totalAssets.count : 0,
        assignedAssets: assignedAssets ? assignedAssets.count : 0,
        availableAssets: availableAssets ? availableAssets.count : 0,
        maintenanceAssets: maintenanceAssets ? maintenanceAssets.count : 0,
        totalValue: totalValue && totalValue.total ? totalValue.total : 0,
        totalEmployees: totalEmployees ? totalEmployees.count : 0,
        activeEmployees: activeEmployees ? activeEmployees.count : 0,
        openMaintenance: openMaintenance ? openMaintenance.count : 0,
        categoryStats
      }
    });
  } catch (err) {
    console.error('Report summary error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve report summary.' });
  }
});

// GET /api/reports/export/:kind
router.get('/export/:kind', authMiddleware, async (req, res) => {
  try {
    const { kind } = req.params;
    let headers = [];
    let rows = [];
    let filename = `assetflow-${kind}.csv`;

    if (kind === 'employees') {
      filename = 'assetflow-employee-directory.csv';
      headers = ['Employee ID', 'Full name', 'Email', 'Phone', 'Department', 'Designation', 'Location', 'Status', 'Date joined'];
      const data = await allAsync('SELECT * FROM employees ORDER BY id ASC');
      rows = data.map((e) => [e.id, e.name, e.email, e.phone, e.department, e.designation, e.location, e.status, e.joined]);
    } else if (kind === 'assignments') {
      filename = 'assetflow-asset-assignments.csv';
      headers = ['Assignment ID', 'Asset ID', 'Asset name', 'Employee ID', 'Employee name', 'Department', 'Assigned date', 'Expected return', 'Return date', 'Status', 'Remarks'];
      const data = await allAsync('SELECT * FROM assignments ORDER BY date DESC, id DESC');
      rows = data.map((x) => [x.id, x.asset_id, x.asset_name, x.employee_id, x.employee_name, x.department, x.date, x.expected, x.return_date, x.status, x.remarks]);
    } else if (kind === 'maintenance') {
      filename = 'assetflow-maintenance-register.csv';
      headers = ['Case ID', 'Asset ID', 'Issue', 'Reported date', 'Provider', 'Estimated cost (INR)', 'Status'];
      const data = await allAsync('SELECT * FROM maintenance ORDER BY reported DESC, id DESC');
      rows = data.map((m) => [m.id, m.asset_id, m.issue, m.reported, m.provider, m.cost, m.status]);
    } else if (kind === 'categories') {
      filename = 'assetflow-category-summary.csv';
      headers = ['Category', 'Total assets', 'Assigned', 'Available', 'Under maintenance'];
      const categories = await allAsync('SELECT name FROM categories ORDER BY name ASC');
      rows = await Promise.all(
        categories.map(async (c) => {
          const total = await getAsync('SELECT COUNT(*) as count FROM assets WHERE category = ?', [c.name]);
          const assigned = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Assigned'", [c.name]);
          const available = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Available'", [c.name]);
          const maintenance = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Under Maintenance'", [c.name]);
          return [c.name, total?.count || 0, assigned?.count || 0, available?.count || 0, maintenance?.count || 0];
        })
      );
    } else if (kind === 'audit') {
      filename = 'assetflow-audit-activity.csv';
      headers = ['Action', 'Asset ID', 'Employee ID', 'Timestamp', 'Description', 'User'];
      const data = await allAsync('SELECT * FROM audit_logs ORDER BY id DESC');
      rows = data.map((l) => [l.action, l.asset_id, l.employee_id, l.time, l.description, l.user_email]);
    } else {
      // Default: assets
      filename = 'assetflow-asset-inventory.csv';
      headers = ['Asset ID', 'Asset name', 'Category', 'Brand', 'Model', 'Serial number', 'Status', 'Employee ID', 'Employee name', 'Purchase date', 'Purchase price (INR)', 'Condition', 'Warranty'];
      const data = await allAsync('SELECT * FROM assets ORDER BY id ASC');
      rows = data.map((a) => [a.id, a.name, a.category, a.brand, a.model, a.serial, a.status, a.employee_id || '', a.employee_name || '', a.purchase_date, a.price, a.condition, a.warranty]);
    }

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((v) => {
            const s = String(v ?? '');
            return '"' + s.replaceAll('"', '""') + '"';
          })
          .join(',')
      )
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('\ufeff' + csvContent);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate export file.' });
  }
});

module.exports = router;
