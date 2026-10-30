const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);
db.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables) => {
  if (err) { console.error(err); process.exit(1); }
  let done = 0;
  tables.forEach(t => {
    db.get(`SELECT COUNT(*) as cnt FROM "${t.name}"`, [], (e, row) => {
      console.log(`${t.name}: ${row ? row.cnt : 'ERR'} rows`);
      if (++done === tables.length) { db.close(); process.exit(0); }
    });
  });
});
