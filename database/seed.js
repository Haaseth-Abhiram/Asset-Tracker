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

  console.log('Seeding completed: Core configuration, lookup tables, and Admin account created.');
  console.log('Employees and Assets tables are left clean for real data.');
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
