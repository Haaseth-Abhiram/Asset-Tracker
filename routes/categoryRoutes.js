const express = require('express');
const router = express.Router();
const { allAsync, runAsync, getAsync, transactionAsync } = require('../database/database');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/categories
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await allAsync('SELECT * FROM categories ORDER BY name ASC');

    const stats = await Promise.all(
      categories.map(async (c) => {
        const total = await getAsync('SELECT COUNT(*) as count FROM assets WHERE category = ?', [c.name]);
        const assigned = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Assigned'", [c.name]);
        const available = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Available'", [c.name]);
        const maintenance = await getAsync("SELECT COUNT(*) as count FROM assets WHERE category = ? AND status = 'Under Maintenance'", [c.name]);

        return {
          id: c.id,
          name: c.name,
          group: c.group_name,
          total: total ? total.count : 0,
          assigned: assigned ? assigned.count : 0,
          available: available ? available.count : 0,
          maintenance: maintenance ? maintenance.count : 0
        };
      })
    );

    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Fetch categories error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve categories.' });
  }
});

// POST /api/categories
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, group = 'Computing' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const trimmed = name.trim();
    const existing = await getAsync('SELECT id FROM categories WHERE name = ?', [trimmed]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Category already exists.' });
    }

    await runAsync('INSERT INTO categories (name, group_name) VALUES (?, ?)', [trimmed, group]);

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      ['Asset Category Added', '—', '—', trimmed, new Date().toISOString(), req.user?.email || 'admin']
    );

    return res.status(201).json({ success: true, message: 'Category added successfully.' });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
});

// POST /api/categories/adjust-stock
router.post('/adjust-stock', authMiddleware, async (req, res) => {
  try {
    const { stockCategory, operation, quantity, reason = '' } = req.body;
    const qty = parseInt(quantity, 10);

    if (!stockCategory) {
      return res.status(400).json({ success: false, error: 'Category is required.' });
    }
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, error: 'Quantity must be a positive integer.' });
    }
    if (!['add', 'remove'].includes(operation)) {
      return res.status(400).json({ success: false, error: "Operation must be 'add' or 'remove'." });
    }

    const prefixSetting = await getAsync("SELECT value FROM settings WHERE key = 'prefix'");
    const prefix = prefixSetting ? prefixSetting.value : 'AST';

    await transactionAsync(async () => {
      if (operation === 'remove') {
        const availableAssets = await allAsync(
          "SELECT id FROM assets WHERE category = ? AND status = 'Available' LIMIT ?",
          [stockCategory, qty]
        );

        if (availableAssets.length < qty) {
          throw new Error(`Insufficient available stock. Only ${availableAssets.length} ${stockCategory} assets are available to remove.`);
        }

        for (const a of availableAssets) {
          await runAsync(
            "UPDATE assets SET status = 'Retired', retirement_reason = ? WHERE id = ?",
            [reason || 'Stock adjustment - retired', a.id]
          );
        }
      } else {
        // Add new stock units
        const lastAsset = await getAsync("SELECT id FROM assets WHERE id LIKE ? ORDER BY id DESC LIMIT 1", [`${prefix}-%`]);
        let maxNum = 0;
        if (lastAsset && lastAsset.id) {
          const num = parseInt(lastAsset.id.split('-').pop(), 10);
          if (!isNaN(num)) maxNum = num;
        }

        const today = new Date().toISOString().slice(0, 10);

        for (let i = 0; i < qty; i++) {
          maxNum++;
          const id = `${prefix}-${String(maxNum).padStart(4, '0')}`;
          const serial = `STOCK-${id}-${Date.now().toString(16).toUpperCase()}`;

          await runAsync(
            `INSERT INTO assets 
              (id, name, category, brand, model, serial, purchase_date, price, vendor, warranty, location, condition, status, organization, stock_note) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              `${stockCategory} Stock`,
              stockCategory,
              'To be recorded',
              'Pending details',
              serial,
              today,
              0,
              '',
              '',
              'Main office',
              'Good',
              'Available',
              'C1',
              reason
            ]
          );
        }
      }
    });

    await runAsync(
      'INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'Inventory Adjusted',
        '—',
        '—',
        `${operation === 'add' ? 'Added' : 'Removed'} ${qty} ${stockCategory} unit(s). ${reason}`,
        new Date().toISOString(),
        req.user?.email || 'admin'
      ]
    );

    return res.json({
      success: true,
      message: `${qty} ${stockCategory} unit(s) ${operation === 'add' ? 'added to' : 'removed from'} available stock.`
    });
  } catch (err) {
    console.error('Adjust stock error:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to adjust inventory stock.' });
  }
});

module.exports = router;
