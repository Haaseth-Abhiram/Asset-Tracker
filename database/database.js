const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let dbPath;
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/database.sqlite';
  const repoDbPath = path.resolve(process.cwd(), 'database/database.sqlite');
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(repoDbPath)) {
    try {
      fs.copyFileSync(repoDbPath, tmpDbPath);
      console.log('Copied database to writable /tmp for Vercel.');
    } catch (e) {
      console.error('Failed to copy database to /tmp:', e.message);
    }
  }
  dbPath = tmpDbPath;
} else {
  dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './database/database.sqlite');
}

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

    // Ensure default 3 companies (C1, C2, C3) exist for Company Inventory Overview
    const companyCount = await getAsync("SELECT COUNT(*) as count FROM companies");
    if (!companyCount || companyCount.count === 0) {
      await runAsync("INSERT OR IGNORE INTO companies (id, name, logo) VALUES ('C1', 'C1', ''), ('C2', 'C2', ''), ('C3', 'C3', '')");
      console.log('Initialized 3 companies: C1, C2, C3.');
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
