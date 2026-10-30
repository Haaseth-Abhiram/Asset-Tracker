const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let regularToken = '';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function multipartRequest(method, path, fields, file, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let postData = '';
    for (const [k, v] of Object.entries(fields)) {
      postData += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
    if (file) {
      postData += `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"\r\nContent-Type: ${file.mimetype}\r\n\r\n`;
    }
    const preBuffer = Buffer.from(postData, 'utf-8');
    const postBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBuffer = file
      ? Buffer.concat([preBuffer, Buffer.from(file.content), postBuffer])
      : Buffer.from(postData + `--${boundary}--\r\n`, 'utf-8');

    const url = new URL(path, BASE_URL);
    const req = http.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBuffer.length,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );
    req.on('error', reject);
    req.write(fullBuffer);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Backend API Test Suite ---\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err.message);
      failed++;
    }
  }

  // 1. Health Check
  await test('GET /api/health should return status healthy', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  // 2. Authentication: Invalid Login
  await test('POST /api/auth/login with wrong password should fail with 401', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@assetflow.workspace',
      password: 'wrongpassword'
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // 3. Authentication: Admin Login
  await test('POST /api/auth/login with admin credentials should return 200 and JWT', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@assetflow.workspace',
      password: 'assetflow123'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'Administrator');
    adminToken = res.body.token;
  });

  // 4. Authentication: Register New User
  const testUserEmail = `testuser_${Date.now()}@example.com`;
  await test('POST /api/auth/register should create a Workspace user', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Test Tester',
      email: testUserEmail,
      password: 'password123'
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'Workspace user');
    regularToken = res.body.token;
  });

  // 5. Auth Me
  await test('GET /api/auth/me with token should return current user', async () => {
    const res = await request('GET', '/api/auth/me', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'admin@assetflow.workspace');
  });

  // 6. Security: Unauthorized without token
  await test('GET /api/employees without token should return 401', async () => {
    const res = await request('GET', '/api/employees');
    assert.strictEqual(res.status, 401);
  });

  // 7. Security: Role-based authorization
  await test('GET /api/users with Workspace user should return 403 Forbidden', async () => {
    const res = await request('GET', '/api/users', null, regularToken);
    assert.strictEqual(res.status, 403);
  });

  await test('GET /api/users with Administrator should return 200', async () => {
    const res = await request('GET', '/api/users', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  // 8. Employees: List & Filter
  await test('GET /api/employees should return 25+ employees', async () => {
    const res = await request('GET', '/api/employees', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 25);
  });

  // 9. Employees: Create
  const newEmpId = `EMP-TEST-${Date.now().toString().slice(-4)}`;
  await test('POST /api/employees should create new employee record in SQLite', async () => {
    const res = await request(
      'POST',
      '/api/employees',
      {
        id: newEmpId,
        name: 'Integration Test Employee',
        email: `emp_${Date.now()}@test.com`,
        phone: '+91 9800000000',
        department: 'Development',
        designation: 'Backend Tester',
        organization: 'C1'
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.id, newEmpId);
  });

  // 10. Employees: Detail with assigned assets
  await test(`GET /api/employees/${newEmpId} should return employee details`, async () => {
    const res = await request('GET', `/api/employees/${newEmpId}`, null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, newEmpId);
    assert.ok(Array.isArray(res.body.data.assignedAssets));
  });

  // 11. Assets: List
  await test('GET /api/assets should return 100+ assets from database', async () => {
    const res = await request('GET', '/api/assets', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 100);
  });

  // 12. Assets: Create & Unique Serial Validation
  const uniqueSerial = `SN-TEST-${Date.now()}`;
  await test('POST /api/assets should create asset in database', async () => {
    const res = await request(
      'POST',
      '/api/assets',
      {
        name: 'ThinkPad T14 Test',
        category: 'Laptop',
        brand: 'Lenovo',
        model: 'T14 Gen 4',
        serial: uniqueSerial,
        price: 75000,
        condition: 'Good',
        status: 'Available',
        organization: 'C1'
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.id);
  });

  await test('POST /api/assets duplicate serial should return 409', async () => {
    const res = await request(
      'POST',
      '/api/assets',
      {
        name: 'Duplicate Serial Asset',
        category: 'Laptop',
        brand: 'Lenovo',
        serial: uniqueSerial
      },
      adminToken
    );
    assert.strictEqual(res.status, 409);
  });

  // 12b. Assets: Photo Upload & Update
  let photoAssetId = '';
  let uploadedPhotoPath = '';
  await test('POST /api/assets with imageFile multipart upload should save photo to database', async () => {
    const photoSerial = `SN-PHOTO-${Date.now()}`;
    const fakeImageBuffer = Buffer.from('fake-png-binary-data');
    const res = await multipartRequest(
      'POST',
      '/api/assets',
      {
        name: 'Dell XPS 15 Photo Test',
        category: 'Laptop',
        brand: 'Dell',
        model: 'XPS 15 9530',
        serial: photoSerial,
        price: '145000',
        status: 'Available',
        condition: 'Excellent',
        organization: 'C1'
      },
      {
        fieldname: 'imageFile',
        filename: 'laptop_photo.png',
        mimetype: 'image/png',
        content: fakeImageBuffer
      },
      adminToken
    );

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.id);
    assert.ok(res.body.data.image);
    assert.ok(res.body.data.image.startsWith('/api/documents/file/'));
    photoAssetId = res.body.data.id;
    uploadedPhotoPath = res.body.data.image;
  });

  await test('GET uploaded asset photo should return 200 image stream', async () => {
    const res = await request('GET', uploadedPhotoPath);
    assert.strictEqual(res.status, 200);
  });

  await test('PUT /api/assets/:id with updated photo should update image in SQLite database', async () => {
    const fakeUpdatedImageBuffer = Buffer.from('updated-laptop-photo-data');
    const res = await multipartRequest(
      'PUT',
      `/api/assets/${photoAssetId}`,
      {
        name: 'Dell XPS 15 (Updated)',
        category: 'Laptop',
        brand: 'Dell'
      },
      {
        fieldname: 'imageFile',
        filename: 'updated_laptop.png',
        mimetype: 'image/png',
        content: fakeUpdatedImageBuffer
      },
      adminToken
    );

    assert.strictEqual(res.status, 200);

    // Verify detail endpoint reflects updated image
    const getRes = await request('GET', `/api/assets/${photoAssetId}`, null, adminToken);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.data.name, 'Dell XPS 15 (Updated)');
    assert.ok(getRes.body.data.image);
    assert.notStrictEqual(getRes.body.data.image, uploadedPhotoPath);
    assert.ok(getRes.body.data.image.includes('updated_laptop'));
  });

  // 13. Assignments: Assign Available Asset to Employee
  let assignedAssetId = '';
  await test('POST /api/assignments should assign asset to employee', async () => {
    // Find an available asset
    const assetsRes = await request('GET', '/api/assets?status=Available', null, adminToken);
    const available = assetsRes.body.data[0];
    assert.ok(available, 'At least one asset should be Available');
    assignedAssetId = available.id;

    const res = await request(
      'POST',
      '/api/assignments',
      {
        employeeId: newEmpId,
        assetIds: assignedAssetId,
        date: new Date().toISOString().slice(0, 10),
        remarks: 'Test assignment'
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);

    // Verify asset status is now Assigned
    const assetCheck = await request('GET', `/api/assets/${assignedAssetId}`, null, adminToken);
    assert.strictEqual(assetCheck.body.data.status, 'Assigned');
    assert.strictEqual(assetCheck.body.data.employeeId, newEmpId);
  });

  // 14. Transfers: Transfer Asset to another Employee
  await test('POST /api/assignments/transfer should reassign asset', async () => {
    const res = await request(
      'POST',
      '/api/assignments/transfer',
      {
        assetId: assignedAssetId,
        employeeId: 'EMP-1002',
        date: new Date().toISOString().slice(0, 10),
        remarks: 'Test transfer'
      },
      adminToken
    );
    assert.strictEqual(res.status, 200);

    const assetCheck = await request('GET', `/api/assets/${assignedAssetId}`, null, adminToken);
    assert.strictEqual(assetCheck.body.data.employeeId, 'EMP-1002');
  });

  // 15. Returns: Request Return & Process Return
  await test('POST /api/returns/requests should create a return request', async () => {
    const res = await request(
      'POST',
      '/api/returns/requests',
      {
        assetId: assignedAssetId
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);
  });

  await test('POST /api/returns should process inspection and return asset to Available', async () => {
    const res = await request(
      'POST',
      '/api/returns',
      {
        assetId: assignedAssetId,
        date: new Date().toISOString().slice(0, 10),
        condition: 'Good',
        remarks: 'Returned in good condition'
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);

    const assetCheck = await request('GET', `/api/assets/${assignedAssetId}`, null, adminToken);
    assert.strictEqual(assetCheck.body.data.status, 'Available');
    assert.strictEqual(assetCheck.body.data.employeeId, '');
  });

  // 16. Asset Requests: Create & Decision
  let createdReqId = '';
  await test('POST /api/requests should submit new request', async () => {
    const res = await request(
      'POST',
      '/api/requests',
      {
        employeeId: 'EMP-1001',
        asset: 'Keyboard',
        reason: 'Mechanical keyboard for coding',
        priority: 'High'
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);
    createdReqId = res.body.data.id;
  });

  await test(`PUT /api/requests/${createdReqId}/decision should approve request`, async () => {
    const res = await request(
      'PUT',
      `/api/requests/${createdReqId}/decision`,
      {
        decision: 'Approved'
      },
      adminToken
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'Approved');
  });

  // 17. Maintenance
  await test('POST /api/maintenance should log maintenance case and set asset Under Maintenance', async () => {
    const res = await request(
      'POST',
      '/api/maintenance',
      {
        assetId: assignedAssetId,
        issue: 'Keyboard key stuck',
        reported: new Date().toISOString().slice(0, 10),
        provider: 'Local Tech',
        cost: 450,
        status: 'In Progress'
      },
      adminToken
    );
    assert.strictEqual(res.status, 201);

    const assetCheck = await request('GET', `/api/assets/${assignedAssetId}`, null, adminToken);
    assert.strictEqual(assetCheck.body.data.status, 'Under Maintenance');
  });

  // 18. Stock Adjustment
  await test('POST /api/categories/adjust-stock should add batch units', async () => {
    const res = await request(
      'POST',
      '/api/categories/adjust-stock',
      {
        stockCategory: 'Mouse',
        operation: 'add',
        quantity: 2,
        reason: 'PO #10928 batch order'
      },
      adminToken
    );
    assert.strictEqual(res.status, 200);
  });

  // 19. Companies & Settings
  await test('GET /api/companies should return 3 organizations', async () => {
    const res = await request('GET', '/api/companies', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 3);
  });

  await test('GET /api/settings should return workspace settings & stats', async () => {
    const res = await request('GET', '/api/settings', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.settings.org, 'ZylloTech Asset Management');
    assert.ok(res.body.data.stats.assets > 0);
  });

  // 20. Reports Summary & CSV Export
  await test('GET /api/reports/summary should return consolidated stats', async () => {
    const res = await request('GET', '/api/reports/summary', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.totalAssets > 0);
  });

  await test('GET /api/reports/export/assets should return CSV file', async () => {
    const res = await request('GET', '/api/reports/export/assets', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
  });

  // 21. Full Data Bundle Synchronization
  await test('GET /api/data should return all tables for frontend integration', async () => {
    const res = await request('GET', '/api/data', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.companies);
    assert.ok(res.body.data.employees);
    assert.ok(res.body.data.assets);
    assert.ok(res.body.data.assignments);
    assert.ok(res.body.data.requests);
    assert.ok(res.body.data.returns);
    assert.ok(res.body.data.maintenance);
    assert.ok(res.body.data.logs);
    assert.ok(res.body.data.settings);
  });

  console.log(`\n========================================`);
  console.log(` Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Start test against running server or start instance
const { startServer, getServer } = require('../server');
startServer()
  .then(() => {
    return runTests();
  })
  .then(() => {
    const s = getServer();
    if (s && s.close) {
      s.close();
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
