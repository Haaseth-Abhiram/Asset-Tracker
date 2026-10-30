const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './database/database.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
      } else {
        console.log(`Connected to SQLite database at ${dbPath}`);
      }
    });

    db.run('PRAGMA foreign_keys = ON;');
  }
  return db;
}

// Promise helper functions
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function execAsync(sql) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function transactionAsync(callback) {
  await runAsync('BEGIN TRANSACTION');
  try {
    const result = await callback({ runAsync, getAsync, allAsync });
    await runAsync('COMMIT');
    return result;
  } catch (error) {
    await runAsync('ROLLBACK');
    throw error;
  }
}

async function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await execAsync(schemaSql);

  // Check and run migrations if needed
  try {
    const assetCols = await allAsync("PRAGMA table_info(assets)");
    if (!assetCols.some((c) => c.name === 'image')) {
      await runAsync("ALTER TABLE assets ADD COLUMN image TEXT DEFAULT ''");
      console.log("Migration applied: Added 'image' column to assets table.");
    }
  } catch (migErr) {
    console.error('Migration check warning:', migErr.message);
  }

  console.log('Database schema verified and loaded.');
}

module.exports = {
  getDb,
  runAsync,
  getAsync,
  allAsync,
  execAsync,
  transactionAsync,
  initDb,
  dbPath
};
