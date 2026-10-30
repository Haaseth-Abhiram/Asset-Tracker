-- SQLite Schema for ZylloTech Asset Management

PRAGMA foreign_keys = ON;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Workspace user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table (C1, C2, C3)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    group_name TEXT DEFAULT 'Computing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    organization TEXT NOT NULL DEFAULT 'C1',
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    phone TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    joined TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    location TEXT DEFAULT 'Hyderabad',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization) REFERENCES companies(id) ON UPDATE CASCADE
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT,
    serial TEXT UNIQUE NOT NULL,
    purchase_date TEXT,
    price REAL DEFAULT 0,
    vendor TEXT,
    warranty TEXT,
    location TEXT DEFAULT 'Hyderabad',
    condition TEXT NOT NULL DEFAULT 'Good',
    status TEXT NOT NULL DEFAULT 'Available',
    organization TEXT NOT NULL DEFAULT 'C1',
    employee_id TEXT,
    employee_name TEXT,
    image TEXT DEFAULT '',
    stock_note TEXT,
    retirement_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization) REFERENCES companies(id) ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    department TEXT,
    date TEXT NOT NULL,
    expected TEXT,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Asset Requests table
CREATE TABLE IF NOT EXISTS asset_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    asset TEXT NOT NULL,
    reason TEXT NOT NULL,
    date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Normal',
    status TEXT NOT NULL DEFAULT 'Pending',
    decided_on TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Return Requests table (raised before return is inspected)
CREATE TABLE IF NOT EXISTS return_requests (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    requested_on TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Requested',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Asset Returns table (physical return inspection records)
CREATE TABLE IF NOT EXISTS asset_returns (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    date TEXT NOT NULL,
    condition TEXT NOT NULL DEFAULT 'Good',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Maintenance Cases table
CREATE TABLE IF NOT EXISTS maintenance (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    issue TEXT NOT NULL,
    reported TEXT NOT NULL,
    provider TEXT,
    cost REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Reported',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    asset_id TEXT DEFAULT '—',
    employee_id TEXT DEFAULT '—',
    description TEXT,
    time TEXT NOT NULL,
    user_email TEXT DEFAULT 'system'
);

-- Settings table (key-value)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Documents and file uploads table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by TEXT,
    entity_type TEXT DEFAULT 'general',
    entity_id TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_org ON assets(organization);
CREATE INDEX IF NOT EXISTS idx_assets_employee ON assets(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_assignments_asset ON assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_requests_status ON asset_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_asset ON return_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(time);
