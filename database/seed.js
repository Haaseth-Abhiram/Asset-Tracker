const bcrypt = require('bcryptjs');
const { getDb, runAsync, getAsync, allAsync, initDb } = require('./database');
require('dotenv').config();

const DEPTS = [
  'Development',
  'Testing / QA',
  'Human Resources',
  'Finance',
  'Marketing',
  'IT Administration',
  'Management',
  'Operations'
];

const CATS = [
  'Laptop',
  'Desktop',
  'Workstation',
  'Monitor',
  'Projector',
  'Keyboard',
  'Mouse',
  'Headset',
  'Webcam',
  'Docking Station',
  'Smartphone',
  'Tablet',
  'Router',
  'Switch',
  'Access Point',
  'Server',
  'Storage Device',
  'Printer',
  'Other Accessories'
];

const EMP_NAMES = [
  'Aarav Sharma', 'Vihaan Reddy', 'Aditya Patel', 'Sai Kumar', 'Ishaan Rao',
  'Reyansh Gupta', 'Arjun Verma', 'Krishna Singh', 'Ananya Nair', 'Diya Iyer',
  'Aadhya Das', 'Ira Joshi', 'Saanvi Mishra', 'Meera Naidu', 'Riya Kapoor',
  'Kavya Rao', 'Rahul Nair', 'Rohan Das', 'Karthik Reddy', 'Nikhil Sharma',
  'Pooja Patel', 'Sneha Kumar', 'Varun Gupta', 'Neha Verma', 'Manish Singh'
];

async function seedDatabase(force = false) {
  await initDb();

  const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0 && !force) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('Seeding database with initial records...');

  if (force) {
    await runAsync('DELETE FROM audit_logs');
    await runAsync('DELETE FROM maintenance');
    await runAsync('DELETE FROM asset_returns');
    await runAsync('DELETE FROM return_requests');
    await runAsync('DELETE FROM asset_requests');
    await runAsync('DELETE FROM assignments');
    await runAsync('DELETE FROM assets');
    await runAsync('DELETE FROM employees');
    await runAsync('DELETE FROM categories');
    await runAsync('DELETE FROM departments');
    await runAsync('DELETE FROM companies');
    await runAsync('DELETE FROM settings');
    await runAsync('DELETE FROM users');
  }

  // 1. Settings
  const defaultOrg = 'ZylloTech Asset Management';
  const defaultPrefix = 'AST';
  const defaultCurrency = 'INR';

  await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['org', defaultOrg]);
  await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['prefix', defaultPrefix]);
  await runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['currency', defaultCurrency]);

  // 2. Companies
  const companies = [
    { id: 'C1', name: 'C1', logo: '' },
    { id: 'C2', name: 'C2', logo: '' },
    { id: 'C3', name: 'C3', logo: '' }
  ];
  for (const c of companies) {
    await runAsync('INSERT OR REPLACE INTO companies (id, name, logo) VALUES (?, ?, ?)', [c.id, c.name, c.logo]);
  }

  // 3. Departments
  for (const d of DEPTS) {
    await runAsync('INSERT OR IGNORE INTO departments (name) VALUES (?)', [d]);
  }

  // 4. Categories
  for (const cat of CATS) {
    await runAsync('INSERT OR IGNORE INTO categories (name, group_name) VALUES (?, ?)', [cat, 'Computing']);
  }

  // 5. Users
  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@assetflow.workspace').toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'assetflow123';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Alex Morgan';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  await runAsync(
    'INSERT OR REPLACE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [adminName, adminEmail, hashedAdminPassword, 'Administrator']
  );

  // 6. Employees
  const employees = EMP_NAMES.map((name, i) => ({
    id: `EMP-${1001 + i}`,
    organization: ['C1', 'C2', 'C3'][i % 3],
    name,
    email: name.toLowerCase().replace(/\s+/g, '.') + '@gmail.com',
    phone: `+91 98${String(10000000 + i * 137).slice(0, 8)}`,
    department: DEPTS[i % 5],
    designation: ['Software Engineer', 'QA Analyst', 'Product Designer', 'HR Executive', 'Systems Administrator'][i % 5],
    joined: `202${i % 5}-0${(i % 9) + 1}-12`,
    status: i === 22 ? 'On Leave' : 'Active',
    location: ['Hyderabad', 'Bengaluru', 'Vijayawada'][i % 3]
  }));

  for (const emp of employees) {
    await runAsync(
      `INSERT OR REPLACE INTO employees 
        (id, organization, name, email, phone, department, designation, joined, status, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id,
        emp.organization,
        emp.name,
        emp.email,
        emp.phone,
        emp.department,
        emp.designation,
        emp.joined,
        emp.status,
        emp.location
      ]
    );

    // Also create matching workspace user account for each employee so they can test logging in
    const empHashedPass = await bcrypt.hash('employee123', 10);
    await runAsync(
      'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [emp.name, emp.email, empHashedPass, 'Workspace user']
    );
  }

  // 7. Assets
  const assets = Array.from({ length: 100 }, (_, i) => {
    const cat = CATS[i % 12];
    const emp = i < 67 && i % 9 !== 0 ? employees[(i * 3) % 25] : null;
    const status = i % 29 === 0 ? 'Under Maintenance' : i % 37 === 0 ? 'Damaged' : emp ? 'Assigned' : 'Available';
    const org = emp?.organization || ['C1', 'C2', 'C3'][i % 3];

    return {
      id: `AST-${String(i + 1).padStart(4, '0')}`,
      name: `${cat} ${['Pro', 'Standard', 'Business'][i % 3]}`,
      category: cat,
      brand: ['Dell', 'HP', 'Lenovo', 'Logitech', 'Samsung', 'Apple'][i % 6],
      model: ['ThinkPad E14', 'Latitude 5440', 'ProBook 440', 'Business Edition'][i % 4],
      serial: `NS-${(100000 + i * 173).toString(16).toUpperCase()}`,
      purchaseDate: `202${i % 5}-0${(i % 9) + 1}-08`,
      price: [42000, 68000, 12000, 8500, 2200][i % 5],
      vendor: ['Dell India', 'HP Store', 'TechData', 'Ingram Micro'][i % 4],
      warranty: `202${(i % 5) + 2}-12-31`,
      location: emp?.location || 'Hyderabad',
      condition: i % 23 === 0 ? 'Fair' : 'Good',
      status,
      organization: org,
      employeeId: status === 'Assigned' ? emp.id : '',
      employeeName: status === 'Assigned' ? emp.name : ''
    };
  });

  for (const a of assets) {
    await runAsync(
      `INSERT OR REPLACE INTO assets 
        (id, name, category, brand, model, serial, purchase_date, price, vendor, warranty, location, condition, status, organization, employee_id, employee_name, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id,
        a.name,
        a.category,
        a.brand,
        a.model,
        a.serial,
        a.purchaseDate,
        a.price,
        a.vendor,
        a.warranty,
        a.location,
        a.condition,
        a.status,
        a.organization,
        a.employeeId || null,
        a.employeeName || null,
        a.image || ''
      ]
    );
  }

  // 8. Assignments
  const assignedAssets = assets.filter((a) => a.status === 'Assigned');
  for (let i = 0; i < assignedAssets.length; i++) {
    const a = assignedAssets[i];
    const emp = employees.find((e) => e.id === a.employeeId);
    const assignmentId = `ASN-${String(i + 1).padStart(4, '0')}`;
    const date = `2026-0${(i % 9) + 1}-0${(i % 8) + 1}`;

    await runAsync(
      `INSERT OR REPLACE INTO assignments 
        (id, asset_id, asset_name, employee_id, employee_name, department, date, expected, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [assignmentId, a.id, a.name, a.employeeId, a.employeeName, emp?.department || '', date, '', 'Active']
    );
  }

  // 9. Requests
  await runAsync(
    `INSERT OR REPLACE INTO asset_requests 
      (id, employee_id, employee_name, asset, reason, date, priority, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'REQ-0001',
      'EMP-1005',
      employees[4].name,
      'Monitor',
      'Additional display for development setup',
      '2026-10-28',
      'High',
      'Pending'
    ]
  );

  await runAsync(
    `INSERT OR REPLACE INTO asset_requests 
      (id, employee_id, employee_name, asset, reason, date, priority, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'REQ-0002',
      'EMP-1009',
      employees[8].name,
      'Headset',
      'Replacement for faulty headset',
      '2026-10-26',
      'Normal',
      'Approved'
    ]
  );

  // 10. Maintenance
  await runAsync(
    `INSERT OR REPLACE INTO maintenance 
      (id, asset_id, issue, reported, provider, cost, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['MNT-0001', 'AST-0030', 'Intermittent display flicker', '2026-10-22', 'Dell Service', 1800, 'In Progress']
  );

  // 11. Initial Audit Log
  await runAsync(
    `INSERT INTO audit_logs (action, asset_id, employee_id, description, time, user_email) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'workspace workspace initialized',
      '—',
      '—',
      '100 sample assets and 25 employees loaded into SQLite database',
      new Date().toISOString(),
      adminEmail
    ]
  );

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase(process.argv.includes('--force'))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
