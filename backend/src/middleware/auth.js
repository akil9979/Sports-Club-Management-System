/**
 * Champions Club - Authentication & Authorization Middleware
 * Role: MEMBER 3 (Canonical Database Owner) & Staff Job-Based Access Control
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/database');

/**
 * Helper to fetch staff job details and permissions for an authenticated user
 */
async function loadStaffJobAndPermissions(userId) {
  const staffRes = await query(
    `SELECT e.id AS employee_id, e.employee_number, e.status AS employee_status,
            sjt.id AS job_id, sjt.code AS job_code, sjt.name AS job_name, sjt.is_active AS job_is_active
     FROM employees e
     LEFT JOIN staff_job_types sjt ON sjt.id = e.staff_job_type_id
     WHERE e.user_id = $1`,
    [userId]
  );

  if (staffRes.rowCount === 0) {
    return { staffJob: null, permissions: [] };
  }

  const staff = staffRes.rows[0];
  const staffJob = staff.job_id ? {
    id: staff.job_id,
    code: staff.job_code,
    name: staff.job_name,
    isActive: staff.job_is_active
  } : null;

  let permissions = [];
  if (staff.job_id && staff.job_is_active && staff.employee_status === 'active') {
    const permRes = await query(
      `SELECT p.code
       FROM permissions p
       JOIN staff_job_type_permissions sjp ON sjp.permission_id = p.id
       WHERE sjp.staff_job_type_id = $1`,
      [staff.job_id]
    );
    permissions = permRes.rows.map(r => r.code);
  }

  return {
    employeeId: staff.employee_id,
    employeeNumber: staff.employee_number,
    staffJob,
    permissions
  };
}

/**
 * Verify JWT token and attach authenticated user to req.user with job permissions
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
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: jwtErr.name === 'TokenExpiredError' ? 'Session expired, please login again' : 'Invalid token signature'
      });
    }

    const userResult = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.is_active,
              m.id AS member_id, m.member_number
       FROM users u
       LEFT JOIN members m ON m.user_id = u.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userResult.rowCount === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User account is inactive or no longer exists'
      });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      memberId: user.member_id,
      memberNumber: user.member_number,
      isActive: user.is_active
    };

    // If user is staff or manager, load staff job and assigned permissions
    if (['staff', 'manager'].includes(user.role)) {
      const staffInfo = await loadStaffJobAndPermissions(user.id);
      req.user.employeeId = staffInfo.employeeId;
      req.user.staffJob = staffInfo.staffJob;
      req.user.permissions = staffInfo.permissions;
    } else if (user.role === 'admin') {
      req.user.staffJob = null;
      req.user.permissions = ['*'];
    } else {
      req.user.staffJob = null;
      req.user.permissions = [];
    }

    next();
  } catch (err) {
    next(err);
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
        `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.is_active,
                m.id AS member_id, m.member_number
         FROM users u
         LEFT JOIN members m ON m.user_id = u.id
         WHERE u.id = $1`,
        [decoded.userId]
      );
      if (userResult.rowCount > 0 && userResult.rows[0].is_active) {
        const user = userResult.rows[0];
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          memberId: user.member_id,
          memberNumber: user.member_number,
          isActive: user.is_active
        };

        if (['staff', 'manager'].includes(user.role)) {
          const staffInfo = await loadStaffJobAndPermissions(user.id);
          req.user.employeeId = staffInfo.employeeId;
          req.user.staffJob = staffInfo.staffJob;
          req.user.permissions = staffInfo.permissions;
        } else if (user.role === 'admin') {
          req.user.permissions = ['*'];
        }
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
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowed.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Role "${req.user.role}" does not have permission to access this resource`
      });
    }

    next();
  };
}

/**
 * Job-Based Access Control (JBAC) Middleware
 * Enforces fine-grained permission checks on protected endpoints.
 * Admin always has wildcard full access.
 * Staff members must possess at least one of the specified permission codes.
 *
 * @param {...string} permissionCodes - One or more permission codes (e.g. 'products.create')
 */
function requirePermission(...permissionCodes) {
  const required = permissionCodes.flat();
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Admin has full unrestricted access to all operations
    if (req.user.role === 'admin') {
      return next();
    }

    // Lazy load permissions if not already attached to req.user
    if (!req.user.permissions) {
      const staffInfo = await loadStaffJobAndPermissions(req.user.id);
      req.user.employeeId = staffInfo.employeeId;
      req.user.staffJob = staffInfo.staffJob;
      req.user.permissions = staffInfo.permissions;
    }

    const userPerms = req.user.permissions || [];
    const hasAccess = required.some(p => userPerms.includes(p));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Forbidden: You do not have permission to perform this action. Required: ${required.join(' or ')}`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireRole: authorize,
  requireAdmin: authorize('admin'),
  requireStaff: authorize('staff', 'manager', 'admin'),
  requireMember: authorize('member', 'staff', 'manager', 'admin'),
  requirePermission,
  loadStaffJobAndPermissions
};
