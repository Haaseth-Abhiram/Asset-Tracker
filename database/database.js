const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Supabase PostgreSQL Cloud Configuration
const SUPABASE_DEFAULT_URL = 'postgresql://postgres.zmzhtbyjhpuuiordfiew:ccFvhtCsGgk0dsud@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const connectionString = process.env.DATABASE_URL || SUPABASE_DEFAULT_URL;
const isPostgres = Boolean(connectionString && (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')));

let pgPool = null;
let sqliteDb = null;
let dbPath = '';

if (isPostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  console.log('Database Engine: Supabase PostgreSQL Cloud (Persistent across all users and deployments)');
} else {
  const sqlite3 = require('sqlite3').verbose();
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/database.sqlite';
    const repoDbPath = path.resolve(process.cwd(), 'database/database.sqlite');
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(repoDbPath)) {
      try {
        fs.copyFileSync(repoDbPath, tmpDbPath);
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

  function getSqliteDb() {
    if (!sqliteDb) {
      sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Failed to connect to SQLite database:', err.message);
        } else {
          console.log(`Database Engine: SQLite local (${dbPath})`);
        }
      });
      sqliteDb.run('PRAGMA foreign_keys = ON;');
    }
    return sqliteDb;
  }
}

// Convert SQLite SQL syntax into PostgreSQL syntax
function formatQuery(sql) {
  if (!isPostgres) return sql;

  let paramIndex = 1;
  let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

  // Handle SQLite-specific conflict statements
  if (/insert\s+or\s+ignore\s+into\s+companies/i.test(pgSql)) {
    pgSql = pgSql.replace(/insert\s+or\s+ignore\s+into\s+companies/i, 'INSERT INTO companies') + ' ON CONFLICT (id) DO NOTHING';
  } else if (/insert\s+or\s+ignore\s+into\s+categories/i.test(pgSql)) {
    pgSql = pgSql.replace(/insert\s+or\s+ignore\s+into\s+categories/i, 'INSERT INTO categories') + ' ON CONFLICT (name) DO NOTHING';
  } else if (/insert\s+or\s+ignore\s+into\s+departments/i.test(pgSql)) {
    pgSql = pgSql.replace(/insert\s+or\s+ignore\s+into\s+departments/i, 'INSERT INTO departments') + ' ON CONFLICT (name) DO NOTHING';
  } else if (/insert\s+or\s+replace\s+into\s+companies/i.test(pgSql)) {
    pgSql = pgSql.replace(/insert\s+or\s+replace\s+into\s+companies/i, 'INSERT INTO companies') + ' ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo';
  } else if (/insert\s+or\s+replace\s+into\s+settings/i.test(pgSql)) {
    pgSql = pgSql.replace(/insert\s+or\s+replace\s+into\s+settings/i, 'INSERT INTO settings') + ' ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
  } else if (/insert\s+or\s+replace\s+into\s+users/i.test(pgSql)) {
    pgSql = pgSql.replace(/insert\s+or\s+replace\s+into\s+users/i, 'INSERT INTO users') + ' ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = EXCLUDED.role';
  }

  // Append RETURNING id for inserts on tables with auto-increment ID
  if (/insert\s+into\s+(users|documents|audit_logs|categories|departments)\s+/i.test(pgSql) && !/returning/i.test(pgSql)) {
    pgSql += ' RETURNING id';
  }

  return pgSql;
}

// Promise helper functions
async function runAsync(sql, params = []) {
  if (isPostgres) {
    const pgSql = formatQuery(sql);
    const res = await pgPool.query(pgSql, params);
    const lastID = (res.rows && res.rows[0] && res.rows[0].id) ? res.rows[0].id : null;
    return { lastID, changes: res.rowCount };
  }
  return new Promise((resolve, reject) => {
    const database = getSqliteDb();
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function getAsync(sql, params = []) {
  if (isPostgres) {
    const pgSql = formatQuery(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0] || null;
  }
  return new Promise((resolve, reject) => {
    const database = getSqliteDb();
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function allAsync(sql, params = []) {
  if (isPostgres) {
    const pgSql = formatQuery(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows || [];
  }
  return new Promise((resolve, reject) => {
    const database = getSqliteDb();
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function execAsync(sql) {
  if (isPostgres) {
    return await pgPool.query(sql);
  }
  return new Promise((resolve, reject) => {
    const database = getSqliteDb();
    database.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function transactionAsync(callback) {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const helper = {
        runAsync: async (sql, params = []) => {
          const pgSql = formatQuery(sql);
          const res = await client.query(pgSql, params);
          const lastID = (res.rows && res.rows[0] && res.rows[0].id) ? res.rows[0].id : null;
          return { lastID, changes: res.rowCount };
        },
        getAsync: async (sql, params = []) => {
          const pgSql = formatQuery(sql);
          const res = await client.query(pgSql, params);
          return res.rows[0] || null;
        },
        allAsync: async (sql, params = []) => {
          const pgSql = formatQuery(sql);
          const res = await client.query(pgSql, params);
          return res.rows || [];
        }
      };
      const result = await callback(helper);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

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

// PostgreSQL cloud schema
const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Workspace user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    group_name TEXT DEFAULT 'Computing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    organization TEXT NOT NULL DEFAULT 'C1' REFERENCES companies(id) ON UPDATE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    joined TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    location TEXT DEFAULT 'Hyderabad',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT,
    serial TEXT UNIQUE NOT NULL,
    purchase_date TEXT,
    price NUMERIC DEFAULT 0,
    vendor TEXT,
    warranty TEXT,
    location TEXT DEFAULT 'Hyderabad',
    condition TEXT NOT NULL DEFAULT 'Good',
    status TEXT NOT NULL DEFAULT 'Available',
    organization TEXT NOT NULL DEFAULT 'C1' REFERENCES companies(id) ON UPDATE CASCADE,
    employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    image TEXT DEFAULT '',
    stock_note TEXT,
    retirement_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    department TEXT,
    date TEXT NOT NULL,
    expected TEXT,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    asset TEXT NOT NULL,
    reason TEXT NOT NULL,
    date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Pending',
    decided_on TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_requests (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    requested_on TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Requested',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_returns (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    date TEXT NOT NULL,
    condition TEXT NOT NULL DEFAULT 'Good',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    reported TEXT NOT NULL,
    provider TEXT,
    cost NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Reported',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    asset_id TEXT DEFAULT '—',
    employee_id TEXT DEFAULT '—',
    description TEXT,
    time TEXT NOT NULL,
    user_email TEXT DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_employee ON assets(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
`;

async function initDb() {
  if (isPostgres) {
    try {
      await pgPool.query(POSTGRES_SCHEMA);

      // Ensure 3 default companies
      await pgPool.query(`
        INSERT INTO companies (id, name, logo)
        VALUES ('C1', 'C1', ''), ('C2', 'C2', ''), ('C3', 'C3', '')
        ON CONFLICT (id) DO NOTHING
      `);

      // Ensure default administrator account
      const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@assetflow.workspace').toLowerCase();
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'assetflow123';
      const adminName = process.env.DEFAULT_ADMIN_NAME || 'Alex Morgan';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await pgPool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, 'Administrator')
        ON CONFLICT (email) DO NOTHING
      `, [adminName, adminEmail, hashedAdminPassword]);

      // Ensure default categories
      const categories = [
        'Laptop','Desktop','Workstation','Monitor','Projector','Keyboard','Mouse',
        'Headset','Webcam','Docking Station','Smartphone','Tablet','Router','Switch',
        'Access Point','Server','Storage Device','Printer','Other Accessories'
      ];
      for (const cat of categories) {
        await pgPool.query(`
          INSERT INTO categories (name) VALUES ($1)
          ON CONFLICT (name) DO NOTHING
        `, [cat]);
      }

      // Ensure default settings
      await pgPool.query(`
        INSERT INTO settings (key, value)
        VALUES ('org', 'ZylloTech Asset Management'), ('prefix', 'AST'), ('currency', 'INR')
        ON CONFLICT (key) DO NOTHING
      `);

      console.log('Supabase PostgreSQL database verified and initialized.');
    } catch (err) {
      console.error('PostgreSQL initialization error:', err.message);
    }
    return;
  }

  // SQLite initialization fallback
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await execAsync(schemaSql);

  try {
    const assetCols = await allAsync("PRAGMA table_info(assets)");
    if (!assetCols.some((c) => c.name === 'image')) {
      await runAsync("ALTER TABLE assets ADD COLUMN image TEXT DEFAULT ''");
      console.log("Migration applied: Added 'image' column to assets table.");
    }

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
  getDb: () => isPostgres ? pgPool : getSqliteDb(),
  runAsync,
  getAsync,
  allAsync,
  execAsync,
  transactionAsync,
  initDb,
  dbPath,
  isPostgres
};
