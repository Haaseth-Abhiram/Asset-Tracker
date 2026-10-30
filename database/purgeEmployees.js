const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Connecting to:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Cannot open database:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');
  db.run('BEGIN TRANSACTION');

  // Clear employees
  db.run('DELETE FROM employees', [], function (err) {
    if (err) console.error('Error clearing employees:', err.message);
    else console.log(`✅ employees: ${this.changes} rows deleted`);
  });

  // Clear non-admin users associated with employees
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@assetflow.workspace').toLowerCase();
  db.run('DELETE FROM users WHERE LOWER(email) != ?', [adminEmail], function (err) {
    if (err) console.error('Error clearing non-admin users:', err.message);
    else console.log(`✅ non-admin users: ${this.changes} rows deleted (Admin preserved)`);
  });

  // Also clear any remaining assignments or employee requests
  db.run('DELETE FROM assignments', [], function (err) {
    if (!err && this.changes > 0) console.log(`✅ assignments: ${this.changes} rows deleted`);
  });
  db.run('DELETE FROM asset_requests', [], function (err) {
    if (!err && this.changes > 0) console.log(`✅ asset_requests: ${this.changes} rows deleted`);
  });
  db.run('DELETE FROM return_requests', [], function (err) {
    if (!err && this.changes > 0) console.log(`✅ return_requests: ${this.changes} rows deleted`);
  });
  db.run('DELETE FROM asset_returns', [], function (err) {
    if (!err && this.changes > 0) console.log(`✅ asset_returns: ${this.changes} rows deleted`);
  });

  db.run('COMMIT', (err) => {
    if (err) {
      console.error('COMMIT failed:', err.message);
      process.exit(1);
    }
  });

  db.run('VACUUM');
  db.run('PRAGMA foreign_keys = ON');

  db.close((err) => {
    if (err) console.error('Close error:', err.message);
    else {
      console.log('\n🎉 Employee and asset data cleared completely.');
      console.log('Admin account (admin@assetflow.workspace) & lookup tables PRESERVED.');
    }
    process.exit(0);
  });
});
