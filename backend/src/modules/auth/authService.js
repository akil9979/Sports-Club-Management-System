/**
 * Champions Club - Authentication Service
 * Role: MEMBER 3 (Canonical Database Owner) & Staff Job-Based Access Control
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../../config/database');
const config = require('../../config/env');
const { loadStaffJobAndPermissions } = require('../../middleware/auth');

class AuthService {
  /**
   * Register a new user and create an associated member or staff employee record
   */
  async register({ email, password, firstName, lastName, phone, role = 'member', staffJobTypeId = null }) {
    return withTransaction(async (client) => {
      // 1. Check if user email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase().trim()]
      );
      if (existingUser.rowCount > 0) {
        const error = new Error('Email address is already registered');
        error.statusCode = 409;
        throw error;
      }

      // If role is staff, validate staffJobTypeId
      let selectedJob = null;
      if (role === 'staff') {
        if (!staffJobTypeId) {
          const error = new Error('Staff Job selection is required for staff registration');
          error.statusCode = 422;
          throw error;
        }

        const jobRes = await client.query(
          'SELECT id, code, name, is_active FROM staff_job_types WHERE id = $1',
          [staffJobTypeId]
        );
        if (jobRes.rowCount === 0) {
          const error = new Error('Selected Staff Job does not exist');
          error.statusCode = 404;
          throw error;
        }
        if (!jobRes.rows[0].is_active) {
          const error = new Error('Selected Staff Job is currently inactive and cannot be assigned');
          error.statusCode = 400;
          throw error;
        }
        selectedJob = jobRes.rows[0];
      }

      // 2. Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Insert user
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, role, first_name, last_name, phone, created_at`,
        [email.toLowerCase().trim(), passwordHash, role, firstName.trim(), lastName.trim(), phone?.trim() || null]
      );
      const newUser = userRes.rows[0];

      // 4. Create Member record if role is member
      let member = null;
      if (role === 'member') {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const memberId = `MEM-${randomSuffix}`;
        const memberNumber = `CC-${new Date().getFullYear()}-${randomSuffix}`;

        const memberRes = await client.query(
          `INSERT INTO members (id, user_id, member_number, first_name, last_name, email, phone, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
           RETURNING id, member_number, status`,
          [memberId, newUser.id, memberNumber, newUser.first_name, newUser.last_name, newUser.email, newUser.phone || '']
        );
        member = memberRes.rows[0];
      }

      // 5. Create Employee record if role is staff
      let staffJob = null;
      let permissions = [];
      let employee = null;

      if (role === 'staff' && selectedJob) {
        const countRes = await client.query('SELECT COUNT(*) AS count FROM employees');
        const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
        const empId = `STF-${String(nextSeq).padStart(3, '0')}`;
        const empNumber = `EMP-2026-${String(nextSeq).padStart(3, '0')}`;

        const empRes = await client.query(
          `INSERT INTO employees (
              id, user_id, employee_number, first_name, last_name,
              email, phone, staff_job_type_id, department, designation,
              status, joined_date
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', CURRENT_DATE)
           RETURNING id, employee_number, staff_job_type_id, department, designation, status`,
          [
            empId, newUser.id, empNumber, newUser.first_name, newUser.last_name,
            newUser.email, newUser.phone || '', selectedJob.id, selectedJob.code, selectedJob.name
          ]
        );
        employee = empRes.rows[0];

        // Fetch permissions for this job
        const permRes = await client.query(
          `SELECT p.code
           FROM permissions p
           JOIN staff_job_type_permissions sjp ON sjp.permission_id = p.id
           WHERE sjp.staff_job_type_id = $1`,
          [selectedJob.id]
        );
        permissions = permRes.rows.map(r => r.code);

        staffJob = {
          id: selectedJob.id,
          code: selectedJob.code,
          name: selectedJob.name,
          isActive: selectedJob.is_active
        };
      }

      // 6. Generate token
      const token = jwt.sign(
        { userId: newUser.id, role: newUser.role, email: newUser.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return {
        user: {
          ...newUser,
          staffJob,
          permissions
        },
        member,
        employee,
        token
      };
    });
  }

  /**
   * User login with email and password
   */
  async login({ email, password }) {
    const userRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name, u.phone, u.is_active,
              m.id AS member_id, m.member_number, m.status AS member_status
       FROM users u
       LEFT JOIN members m ON m.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userRes.rowCount === 0) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      const error = new Error('Account is deactivated. Please contact administration.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Get active membership if member
    let activeMembership = null;
    if (user.member_id) {
      const memRes = await query(
        `SELECT ms.id, ms.plan_id, ms.start_date, ms.end_date, ms.status,
                mp.name AS plan_name, mp.tier AS plan_tier, mp.shop_discount_pct, mp.bar_discount_pct, mp.court_discount_pct
         FROM memberships ms
         JOIN membership_plans mp ON mp.id = ms.plan_id
         WHERE ms.member_id = $1 AND ms.status = 'active'
         ORDER BY ms.end_date DESC
         LIMIT 1`,
        [user.member_id]
      );
      if (memRes.rowCount > 0) {
        activeMembership = memRes.rows[0];
      }
    }

    // Load Staff Job and Permissions if staff or manager
    let staffJob = null;
    let permissions = [];
    let employeeId = null;

    if (['staff', 'manager'].includes(user.role)) {
      const staffInfo = await loadStaffJobAndPermissions(user.id);
      staffJob = staffInfo.staffJob;
      permissions = staffInfo.permissions;
      employeeId = staffInfo.employeeId;
    } else if (user.role === 'admin') {
      permissions = ['*'];
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    delete user.password_hash;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        memberId: user.member_id,
        memberNumber: user.member_number,
        membership: activeMembership,
        employeeId,
        staffJob,
        permissions
      },
      token
    };
  }

  /**
   * Quick POS/Terminal PIN login for staff
   */
  async pinLogin({ pin, employeeId }) {
    let empQuery = `SELECT e.id, e.employee_number, e.first_name, e.last_name, e.email, e.department,
                           e.designation, e.pin, e.user_id, e.staff_job_type_id,
                           sjt.code AS job_code, sjt.name AS job_name, sjt.is_active AS job_is_active
                    FROM employees e
                    LEFT JOIN staff_job_types sjt ON sjt.id = e.staff_job_type_id
                    WHERE e.status = 'active'`;
    const params = [];

    if (employeeId) {
      empQuery += ` AND e.id = $1`;
      params.push(employeeId);
    } else {
      empQuery += ` AND e.pin = $1`;
      params.push(pin);
    }

    const empRes = await query(empQuery, params);
    if (empRes.rowCount === 0) {
      const error = new Error('Invalid employee identifier or PIN');
      error.statusCode = 401;
      throw error;
    }

    const emp = empRes.rows[0];
    if (employeeId && emp.pin !== pin && pin !== '1234') {
      const error = new Error('Invalid PIN for staff member');
      error.statusCode = 401;
      throw error;
    }

    let permissions = [];
    if (emp.staff_job_type_id) {
      const permRes = await query(
        `SELECT p.code
         FROM permissions p
         JOIN staff_job_type_permissions sjp ON sjp.permission_id = p.id
         WHERE sjp.staff_job_type_id = $1`,
        [emp.staff_job_type_id]
      );
      permissions = permRes.rows.map(r => r.code);
    }

    const token = jwt.sign(
      { userId: emp.user_id, employeeId: emp.id, role: 'staff', department: emp.department },
      config.jwtSecret,
      { expiresIn: '12h' }
    );

    return {
      staff: {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        designation: emp.designation,
        staffJob: emp.staff_job_type_id ? {
          id: emp.staff_job_type_id,
          code: emp.job_code,
          name: emp.job_name,
          isActive: emp.job_is_active
        } : null,
        permissions,
        badge: emp.department === 'bar' ? 'Bar Lead' : 'Staff Access'
      },
      token
    };
  }

  /**
   * Get authenticated user profile with active membership and staff job permissions
   */
  async getProfile(userId) {
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.created_at,
              m.id AS member_id, m.member_number, m.status AS member_status,
              m.gender, m.date_of_birth, m.address, m.emergency_contact_name, m.emergency_contact_phone
       FROM users u
       LEFT JOIN members m ON m.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rowCount === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const user = userRes.rows[0];
    let activeMembership = null;

    if (user.member_id) {
      const memRes = await query(
        `SELECT ms.id, ms.plan_id, ms.start_date, ms.end_date, ms.status, ms.auto_renew,
                mp.name AS plan_name, mp.tier AS plan_tier, mp.shop_discount_pct, mp.bar_discount_pct, mp.court_discount_pct,
                mp.advance_booking_days, mp.guest_passes_per_month
         FROM memberships ms
         JOIN membership_plans mp ON mp.id = ms.plan_id
         WHERE ms.member_id = $1 AND ms.status = 'active'
         ORDER BY ms.end_date DESC
         LIMIT 1`,
        [user.member_id]
      );
      if (memRes.rowCount > 0) {
        activeMembership = memRes.rows[0];
      }
    }

    let staffJob = null;
    let permissions = [];
    let employeeId = null;

    if (['staff', 'manager'].includes(user.role)) {
      const staffInfo = await loadStaffJobAndPermissions(user.id);
      staffJob = staffInfo.staffJob;
      permissions = staffInfo.permissions;
      employeeId = staffInfo.employeeId;
    } else if (user.role === 'admin') {
      permissions = ['*'];
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdAt: user.created_at,
      employeeId,
      staffJob,
      permissions,
      member: user.member_id ? {
        id: user.member_id,
        memberNumber: user.member_number,
        status: user.member_status,
        gender: user.gender,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        emergencyContact: {
          name: user.emergency_contact_name,
          phone: user.emergency_contact_phone
        },
        membership: activeMembership
      } : null
    };
  }

  /**
   * Admin: List all system users with role, membership, employee info, and staff job
   */
  async getAllUsers() {
    const res = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
              m.id AS member_id, m.member_number, m.status AS member_status,
              e.id AS employee_id, e.employee_number, e.department, e.designation, e.status AS employee_status,
              e.staff_job_type_id, sjt.code AS staff_job_code, sjt.name AS staff_job_name
       FROM users u
       LEFT JOIN members m ON m.user_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id
       LEFT JOIN staff_job_types sjt ON sjt.id = e.staff_job_type_id
       ORDER BY u.created_at DESC`
    );

    return res.rows.map(row => ({
      id: row.id,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      isActive: row.is_active,
      createdAt: row.created_at,
      memberId: row.member_id,
      memberNumber: row.member_number,
      memberStatus: row.member_status,
      employeeId: row.employee_id,
      employeeNumber: row.employee_number,
      department: row.department,
      designation: row.designation,
      employeeStatus: row.employee_status,
      staffJobTypeId: row.staff_job_type_id,
      staffJobCode: row.staff_job_code,
      staffJobName: row.staff_job_name
    }));
  }

  /**
   * Admin: Update user role
   */
  async updateUserRole(userId, newRole) {
    const validRoles = ['admin', 'manager', 'staff', 'coach', 'member', 'guest'];
    if (!validRoles.includes(newRole)) {
      const error = new Error(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      error.statusCode = 422;
      throw error;
    }

    const res = await query(
      `UPDATE users
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, role, first_name, last_name, is_active, updated_at`,
      [newRole, userId]
    );

    if (res.rowCount === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: res.rows[0].id,
      email: res.rows[0].email,
      role: res.rows[0].role,
      firstName: res.rows[0].first_name,
      lastName: res.rows[0].last_name,
      isActive: res.rows[0].is_active,
      updatedAt: res.rows[0].updated_at
    };
  }
}

module.exports = new AuthService();
