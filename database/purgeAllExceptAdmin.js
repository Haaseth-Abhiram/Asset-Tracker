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

const tablesToEmpty = [
  'employees',
  'assets',
  'assignments',
  'asset_requests',
  'return_requests',
  'asset_returns',
  'maintenance',
  'audit_logs',
  'documents',
  'departments',
  'categories',
  'companies',
  'settings'
];

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');
  db.run('BEGIN TRANSACTION');

  for (const table of tablesToEmpty) {
    db.run(`DELETE FROM ${table}`, [], function (err) {
      if (err) console.error(`Error emptying ${table}:`, err.message);
      else console.log(`✅ ${table}: all rows deleted (${this.changes} rows)`);
    });
  }

  // Ensure ONLY admin user exists in users table
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@assetflow.workspace').toLowerCase();
  db.run('DELETE FROM users WHERE LOWER(email) != ?', [adminEmail], function (err) {
    if (err) console.error('Error clearing non-admin users:', err.message);
    else console.log(`✅ users: non-admin users deleted (${this.changes} rows). ONLY admin preserved.`);
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
      console.log('\n🎉 ALL database tables emptied except Administrator account.');
    }
    process.exit(0);
  });
});
