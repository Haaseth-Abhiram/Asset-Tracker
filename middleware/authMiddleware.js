const jwt = require('jsonwebtoken');
const { getAsync } = require('../database/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'zyllotech_development_jwt_secret_key_9837459128374912';

async function authMiddleware(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing. Please sign in.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please sign in again.'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.'
      });
    }

    const user = await getAsync('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server authentication error'
    });
  }
}

// Optional middleware that extracts user if token exists, but doesn't block if not
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getAsync('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [decoded.id]);
        if (user) req.user = user;
      } catch (e) {
        // Ignore optional auth error
      }
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = { authMiddleware, optionalAuth, JWT_SECRET };
