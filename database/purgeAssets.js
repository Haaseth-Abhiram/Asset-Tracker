// Run from project root OR database folder - resolves correctly either way
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Always resolve to the project root's database/database.sqlite
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('Target DB:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error('Cannot open DB:', err.message); process.exit(1); }
  console.log('Opened successfully.\n');
});

const tables = [
  'audit_logs',
  'documents',
  'asset_returns',
  'return_requests',
  'maintenance',
  'asset_requests',
  'assignments',
  'assets'
];

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');

  // Verify assets count first
  db.get('SELECT COUNT(*) as cnt FROM assets', [], (err, row) => {
    if (err) console.error('Count error:', err.message);
    else console.log(`Assets before delete: ${row.cnt} rows`);
  });

  db.run('BEGIN TRANSACTION');

  for (const table of tables) {
    db.run(`DELETE FROM ${table}`, [], function(err) {
      if (err) console.error(`❌ Error clearing ${table}:`, err.message);
      else console.log(`✅ ${table}: ${this.changes} rows deleted`);
    });
  }

  db.run('COMMIT', (err) => {
    if (err) { console.error('COMMIT failed:', err.message); process.exit(1); }
  });

  // Verify after
  db.get('SELECT COUNT(*) as cnt FROM assets', [], (err, row) => {
    if (err) console.error('Count error:', err.message);
    else console.log(`\nAssets after delete: ${row.cnt} rows`);
    console.log('\n🎉 Done! Employees, users, categories, companies, settings: PRESERVED');
  });

  db.run('PRAGMA foreign_keys = ON');

  db.close((err) => {
    if (err) console.error('Close error:', err.message);
    process.exit(0);
  });
});
