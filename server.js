const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { initDb } = require('./database/database');
const { seedDatabase } = require('./database/seed');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const assetRoutes = require('./routes/assetRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const returnRoutes = require('./routes/returnRoutes');
const requestRoutes = require('./routes/requestRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const companyRoutes = require('./routes/companyRoutes');
const settingRoutes = require('./routes/settingRoutes');
const logRoutes = require('./routes/logRoutes');
const reportRoutes = require('./routes/reportRoutes');
const documentRoutes = require('./routes/documentRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Database Initialization (essential for Vercel Serverless & local dev)
let isDbReady = false;
let dbInitPromise = null;

async function ensureDbReady() {
  if (isDbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initDb();
      await seedDatabase(false);
      isDbReady = true;
    })();
  }
  return dbInitPromise;
}

// Ensure database is initialized before any API request
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await ensureDbReady();
    } catch (err) {
      console.error('Serverless DB initialization warning:', err.message);
    }
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'ZylloTech Asset Management API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/data', dataRoutes);

// Serve static frontend files from workspace root
app.use(express.static(__dirname));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Internal Server Error'
  });
});

let activeServer = null;

// Initialize and start server
async function startServer(port = PORT) {
  try {
    await ensureDbReady();

    return new Promise((resolve, reject) => {
      activeServer = app.listen(port, () => {
        console.log(`====================================================`);
        console.log(` ZylloTech Asset Management Server running!`);
        console.log(` URL: http://localhost:${port}`);
        console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(` Database: SQLite (${process.env.DATABASE_PATH || './database/database.sqlite'})`);
        console.log(`====================================================`);
        resolve(activeServer);
      });

      activeServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} already in use. Connecting to existing running instance...`);
          resolve(null);
        } else {
          reject(err);
        }
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
module.exports.getServer = () => activeServer;
