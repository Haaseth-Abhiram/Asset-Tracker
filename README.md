# ZylloTech Asset Management System

An Enterprise IT Asset Management workspace with a **Node.js & Express.js** backend, persistent **SQLite** database, secure **JWT** authentication, and the original, fully preserved **HTML5, CSS3, and Vanilla JavaScript** frontend.

---

## 1. Overview & Technology Stack

- **Frontend:** Original Vanilla JavaScript, HTML5, CSS3 Single-Page Application (UI/UX 100% preserved)
- **Backend:** Node.js & Express.js REST API
- **Database:** Persistent SQLite (`sqlite3` package) with parameterized queries, transactions, and foreign keys
- **Authentication:** `bcryptjs` password hashing & `jsonwebtoken` (JWT) token verification
- **Security:** `helmet` security headers & `express-rate-limit` brute-force mitigation
- **Validation:** `express-validator` schema validations on all mutation routes
- **File Uploads:** `multer` secure upload handling with MIME-type filtering
- **Email:** `nodemailer` email notification integration

---

## 2. Default Credentials

The database is automatically initialized and seeded on first run with demo organizations, 100 registered assets, 25 employees, and the default administrator account:

- **Administrator:**
  - Email: `admin@assetflow.workspace`
  - Password: `assetflow123`
  - Role: `Administrator`

- **Employee Accounts:**
  - Any seeded employee email (e.g. `aarav.sharma@gmail.com`)
  - Password: `employee123`
  - Role: `Workspace user`

---

## 3. Quick Start & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` (already created with sensible development defaults):
```bash
# Windows PowerShell:
Copy-Item .env.example .env
```

### 3. Initialize & Seed Database (Optional / Automatic)
The SQLite database at `database/database.sqlite` is automatically created and seeded if missing when the server boots. To manually reset or reseed:
```bash
npm run seed
```

### 4. Start the Application
Run the Express application server:
```bash
npm start
```
Or run with live reloading in development:
```bash
npm run dev
```

Then open your browser at:
```text
http://localhost:5000
```

### 5. Run Backend Test Suite
Execute the automated test suite testing all 27 endpoint scenarios:
```bash
npm test
```

---

## 4. Project Directory Structure

```text
zyllotech-asset-management/
├── index.html               # Original frontend HTML entry point
├── styles.css               # Original styling and responsive layout
├── app.js                   # Client SPA logic wired to REST API
├── zyllotech-logo.png       # Original brand assets
├── server.js                # Express application server and static file host
├── package.json             # NPM package scripts and dependencies
├── .env.example             # Template for configuration settings
├── .env                     # Local environment settings
├── .gitignore               # Excludes node_modules, sqlite db, uploads
├── database/
│   ├── database.js          # SQLite connection, async promises & transaction helpers
│   ├── schema.sql           # Complete SQL schema, indexes, and constraints
│   ├── seed.js              # Database bootstrap and demo data seeder
│   └── database.sqlite      # SQLite persistent storage file (auto-generated)
├── middleware/
│   ├── authMiddleware.js    # JWT verification and user session extraction
│   ├── roleMiddleware.js    # Role-based authorization guard (Admin vs User)
│   └── uploadMiddleware.js  # Multer file upload handler and MIME validator
├── routes/
│   ├── authRoutes.js        # /api/auth (login, register, me, logout)
│   ├── userRoutes.js        # /api/users (user list, profile updates)
│   ├── employeeRoutes.js    # /api/employees (CRUD, filters, details)
│   ├── assetRoutes.js       # /api/assets (CRUD, inventory, filters)
│   ├── assignmentRoutes.js  # /api/assignments (allocations, transfers)
│   ├── returnRoutes.js      # /api/returns (inspections, return requests)
│   ├── requestRoutes.js     # /api/requests (asset requests, decisions, email)
│   ├── maintenanceRoutes.js # /api/maintenance (repair cases, status)
│   ├── departmentRoutes.js  # /api/departments (department KPIs)
│   ├── categoryRoutes.js    # /api/categories (stock adjustments)
│   ├── companyRoutes.js     # /api/companies (C1, C2, C3 logos & stats)
│   ├── settingRoutes.js     # /api/settings (preferences, JSON backup, reset)
│   ├── logRoutes.js         # /api/logs (audit trails)
│   ├── reportRoutes.js      # /api/reports (KPI summaries, CSV exports)
│   ├── documentRoutes.js    # /api/documents (file upload & authorized access)
│   └── dataRoutes.js        # /api/data (full SQLite dataset synchronization)
├── uploads/                 # Private uploaded documents and logos
└── tests/
    └── test.js              # Automated integration test suite (27 scenarios)
```

---

## 5. REST API Specification

### Authentication
- `POST /api/auth/login` — Rate-limited sign in with email and password, returns JWT.
- `POST /api/auth/register` — Create a new workspace account.
- `GET /api/auth/me` — Retrieve signed-in user profile from JWT token.
- `POST /api/auth/logout` — Sign out and record audit log.

### Employees
- `GET /api/employees` — Search, filter by organization, department, and employment status.
- `GET /api/employees/:id` — Get detailed employee profile, assigned assets, and history.
- `POST /api/employees` — Create new employee with duplicate ID/email validation.
- `PUT /api/employees/:id` — Update existing employee directory record.
- `DELETE /api/employees/:id` — Remove employee record (Admin only).

### Assets
- `GET /api/assets` — Retrieve asset inventory with status, category, and company filters.
- `GET /api/assets/:id` — View asset details, serial number, and repair history.
- `POST /api/assets` — Add new asset with unique serial validation.
- `PUT /api/assets/:id` — Update asset specifications, condition, and status.
- `DELETE /api/assets/:id` — Delete asset (Admin only).

### Assignments & Transfers
- `GET /api/assignments` — Retrieve allocation register and history.
- `POST /api/assignments` — Assign one or multiple available assets to an active employee.
- `POST /api/assignments/transfer` — Reassign an assigned asset to another employee.

### Returns & Return Requests
- `GET /api/returns` — Physical return inspection register.
- `POST /api/returns` — Inspect returned asset condition and update status to Available/Damaged/Maintenance.
- `GET /api/returns/requests` — View pending employee return requests.
- `POST /api/returns/requests` — Raise return request for an assigned device.
- `PUT /api/returns/:id` — Update return request status and administrator remarks.

### Asset Requests & Email
- `GET /api/requests` — View employee asset requests.
- `POST /api/requests` — Submit new asset request.
- `PUT /api/requests/:id/decision` — Approve or reject request.
- `POST /api/requests/:id/email` — Send or prepare email notification using `nodemailer`.

### Maintenance Cases
- `GET /api/maintenance` — Track repairs, service providers, downtime, and costs.
- `POST /api/maintenance` — Log maintenance case and automatically set asset to Under Maintenance.
- `PUT /api/maintenance/:id` — Update repair progress or mark Completed (returns asset to Available).

### Categories & Departments
- `GET /api/categories` — Category inventory metrics and availability.
- `POST /api/categories` — Register new asset category.
- `POST /api/categories/adjust-stock` — Batch add new stock or retire surplus units.
- `GET /api/departments` — Department breakdown and device allocations.

### Companies & Settings
- `GET /api/companies` — Multi-company overview for C1, C2, and C3.
- `PUT /api/companies/:id` — Update company name and logo (supports Multer file upload).
- `GET /api/settings` — Get workspace organization preferences and storage stats.
- `PUT /api/settings` — Save organization name and asset ID prefix.
- `GET /api/settings/backup` — Download complete JSON workspace database export.
- `POST /api/settings/reset` — Reset database to initial demo state (Admin only).

### Reports & Documents
- `GET /api/reports/summary` — Aggregate metrics for executive dashboard and export centre.
- `GET /api/reports/export/:kind` — Download CSV export (`assets`, `employees`, `assignments`, `maintenance`, `categories`, `audit`).
- `POST /api/documents/upload` — Upload private file using Multer.
- `GET /api/documents/:id` — Secure authenticated file download.
