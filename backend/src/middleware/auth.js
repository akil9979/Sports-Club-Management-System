/**
 * Champions Club - Authentication & Authorization Middleware
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach authenticated user to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const userResult = await query(
      `SELECT id, email, role, first_name, last_name, is_active 
       FROM users 
       WHERE id = $1`,
      [decoded.userId]
    );

    if (userResult.rowCount === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User account is inactive or no longer exists'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: err.name === 'TokenExpiredError' ? 'Session expired, please login again' : 'Invalid token signature'
    });
  }
}

/**
 * Optional authentication: attaches req.user if token is valid, proceeds either way
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const userResult = await query(
        `SELECT id, email, role, first_name, last_name, is_active 
         FROM users 
         WHERE id = $1`,
        [decoded.userId]
      );
      if (userResult.rowCount > 0 && userResult.rows[0].is_active) {
        req.user = userResult.rows[0];
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
}

/**
 * Restrict endpoint to specified roles
 * @param  {...string} roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Role "${req.user.role}" does not have permission to access this resource`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize
};
