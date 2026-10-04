/**
 * Champions Club - Staff Jobs & Permission Management Service
 * Role: Scalable Database-Driven Staff Job Access Control (JBAC)
 */

const { query, withTransaction } = require('../../config/database');

class StaffJobService {
  /**
   * Public / Authenticated: Get all active staff job types for registration & dropdowns
   */
  async getActiveJobTypes() {
    const res = await query(
      `SELECT id, code, name, description, is_active
       FROM staff_job_types
       WHERE is_active = true
       ORDER BY name ASC`
    );
    return res.rows;
  }

  /**
   * Admin: Get all staff job types with permissions list and staff member counts
   */
  async getAllJobTypes() {
    const jobsRes = await query(
      `SELECT sjt.id, sjt.code, sjt.name, sjt.description, sjt.is_active, sjt.created_at, sjt.updated_at,
              COALESCE(emp_counts.staff_count, 0) AS staff_count
       FROM staff_job_types sjt
       LEFT JOIN (
         SELECT staff_job_type_id, COUNT(*) AS staff_count
         FROM employees
         WHERE status = 'active'
         GROUP BY staff_job_type_id
       ) emp_counts ON emp_counts.staff_job_type_id = sjt.id
       ORDER BY sjt.name ASC`
    );

    const jobs = jobsRes.rows;

    // Fetch permissions for all jobs
    const permsRes = await query(
      `SELECT sjp.staff_job_type_id, p.id AS permission_id, p.code, p.module, p.description
       FROM staff_job_type_permissions sjp
       JOIN permissions p ON p.id = sjp.permission_id
       ORDER BY p.module ASC, p.code ASC`
    );

    const permsByJobId = {};
    for (const row of permsRes.rows) {
      if (!permsByJobId[row.staff_job_type_id]) {
        permsByJobId[row.staff_job_type_id] = [];
      }
      permsByJobId[row.staff_job_type_id].push({
        id: row.permission_id,
        code: row.code,
        module: row.module,
        description: row.description
      });
    }

    return jobs.map(j => ({
      id: j.id,
      code: j.code,
      name: j.name,
      description: j.description,
      isActive: j.is_active,
      staffCount: parseInt(j.staff_count || 0, 10),
      permissions: permsByJobId[j.id] || [],
      createdAt: j.created_at,
      updatedAt: j.updated_at
    }));
  }

  /**
   * Admin: Get all available system permissions grouped by functional module
   */
  async getAllPermissions() {
    const res = await query(
      `SELECT id, code, module, description
       FROM permissions
       ORDER BY module ASC, code ASC`
    );

    const grouped = {};
    for (const p of res.rows) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    }

    return {
      all: res.rows,
      grouped
    };
  }

  /**
   * Admin: Create a new Staff Job Type dynamically with assigned permissions
   */
  async createJobType({ name, code, description, permissionIds = [] }) {
    return withTransaction(async (client) => {
      const trimmedName = name.trim();
      const generatedCode = code
        ? code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
        : trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

      // Check duplicate code
      const dupCheck = await client.query('SELECT id FROM staff_job_types WHERE code = $1', [generatedCode]);
      if (dupCheck.rowCount > 0) {
        const error = new Error(`A Staff Job with code '${generatedCode}' already exists`);
        error.statusCode = 409;
        throw error;
      }

      const jobRes = await client.query(
        `INSERT INTO staff_job_types (code, name, description, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id, code, name, description, is_active, created_at, updated_at`,
        [generatedCode, trimmedName, description?.trim() || null]
      );
      const newJob = jobRes.rows[0];

      // Assign permissions
      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        for (const permId of permissionIds) {
          await client.query(
            `INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [newJob.id, permId]
          );
        }
      }

      // Fetch assigned permissions
      const assignedRes = await client.query(
        `SELECT p.id, p.code, p.module, p.description
         FROM permissions p
         JOIN staff_job_type_permissions sjp ON sjp.permission_id = p.id
         WHERE sjp.staff_job_type_id = $1`,
        [newJob.id]
      );

      return {
        id: newJob.id,
        code: newJob.code,
        name: newJob.name,
        description: newJob.description,
        isActive: newJob.is_active,
        staffCount: 0,
        permissions: assignedRes.rows,
        createdAt: newJob.created_at,
        updatedAt: newJob.updated_at
      };
    });
  }

  /**
   * Admin: Update an existing Staff Job Type (name, description, active status, permissions)
   */
  async updateJobType(jobId, { name, description, isActive, permissionIds }) {
    return withTransaction(async (client) => {
      const existing = await client.query('SELECT * FROM staff_job_types WHERE id = $1 FOR UPDATE', [jobId]);
      if (existing.rowCount === 0) {
        const error = new Error(`Staff Job '${jobId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const setClauses = [];
      const params = [jobId];

      if (name !== undefined) {
        params.push(name.trim());
        setClauses.push(`name = $${params.length}`);
      }

      if (description !== undefined) {
        params.push(description?.trim() || null);
        setClauses.push(`description = $${params.length}`);
      }

      if (isActive !== undefined) {
        params.push(Boolean(isActive));
        setClauses.push(`is_active = $${params.length}`);
      }

      if (setClauses.length > 0) {
        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
        await client.query(
          `UPDATE staff_job_types SET ${setClauses.join(', ')} WHERE id = $1`,
          params
        );
      }

      // Update permissions if provided
      if (Array.isArray(permissionIds)) {
        await client.query('DELETE FROM staff_job_type_permissions WHERE staff_job_type_id = $1', [jobId]);
        for (const permId of permissionIds) {
          await client.query(
            `INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [jobId, permId]
          );
        }
      }

      const updatedJobRes = await client.query('SELECT * FROM staff_job_types WHERE id = $1', [jobId]);
      const updatedJob = updatedJobRes.rows[0];

      const assignedRes = await client.query(
        `SELECT p.id, p.code, p.module, p.description
         FROM permissions p
         JOIN staff_job_type_permissions sjp ON sjp.permission_id = p.id
         WHERE sjp.staff_job_type_id = $1`,
        [jobId]
      );

      const staffCountRes = await client.query(
        'SELECT COUNT(*) AS count FROM employees WHERE staff_job_type_id = $1 AND status = \'active\'',
        [jobId]
      );

      return {
        id: updatedJob.id,
        code: updatedJob.code,
        name: updatedJob.name,
        description: updatedJob.description,
        isActive: updatedJob.is_active,
        staffCount: parseInt(staffCountRes.rows[0].count, 10),
        permissions: assignedRes.rows,
        createdAt: updatedJob.created_at,
        updatedAt: updatedJob.updated_at
      };
    });
  }

  /**
   * Admin: List all staff members with linked user and assigned staff job
   */
  async getStaffMembers() {
    const res = await query(
      `SELECT e.id AS employee_id, e.employee_number, e.first_name, e.last_name,
              e.email, e.phone, e.department, e.designation, e.pin, e.hourly_rate,
              e.salary, e.employment_type, e.status AS employee_status, e.joined_date,
              e.staff_job_type_id,
              sjt.code AS job_code, sjt.name AS job_name, sjt.is_active AS job_is_active,
              u.id AS user_id, u.email AS user_email, u.role AS user_role, u.is_active AS user_is_active
       FROM employees e
       LEFT JOIN staff_job_types sjt ON sjt.id = e.staff_job_type_id
       LEFT JOIN users u ON u.id = e.user_id
       ORDER BY e.joined_date DESC, e.first_name ASC`
    );

    return res.rows.map(row => ({
      id: row.employee_id,
      employeeNumber: row.employee_number,
      firstName: row.first_name,
      lastName: row.last_name,
      name: `${row.first_name} ${row.last_name}`,
      email: row.email,
      phone: row.phone,
      department: row.department,
      designation: row.designation,
      pin: row.pin,
      hourlyRate: parseFloat(row.hourly_rate || 0),
      salary: parseFloat(row.salary || 0),
      employmentType: row.employment_type,
      status: row.employee_status,
      joinedDate: row.joined_date,
      staffJob: row.staff_job_type_id ? {
        id: row.staff_job_type_id,
        code: row.job_code,
        name: row.job_name,
        isActive: row.job_is_active
      } : null,
      user: row.user_id ? {
        id: row.user_id,
        email: row.user_email,
        role: row.user_role,
        isActive: row.user_is_active
      } : null
    }));
  }

  /**
   * Admin: Change a staff member's assigned Staff Job Type
   * Automatically updates their permissions instantly with zero code change.
   */
  async updateStaffJob(employeeId, newStaffJobTypeId) {
    return withTransaction(async (client) => {
      // 1. Validate employee exists
      const empRes = await client.query('SELECT * FROM employees WHERE id = $1 FOR UPDATE', [employeeId]);
      if (empRes.rowCount === 0) {
        const error = new Error(`Employee '${employeeId}' not found`);
        error.statusCode = 404;
        throw error;
      }
      const employee = empRes.rows[0];

      // 2. Validate target Staff Job Type
      const jobRes = await client.query('SELECT * FROM staff_job_types WHERE id = $1', [newStaffJobTypeId]);
      if (jobRes.rowCount === 0) {
        const error = new Error(`Target Staff Job '${newStaffJobTypeId}' not found`);
        error.statusCode = 404;
        throw error;
      }
      const targetJob = jobRes.rows[0];

      // 3. Update employee record
      const updateRes = await client.query(
        `UPDATE employees
         SET staff_job_type_id = $1, department = $2, designation = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [targetJob.id, targetJob.code, targetJob.name, employeeId]
      );
      const updated = updateRes.rows[0];

      // 4. Fetch the new permissions effective for this staff member
      const permRes = await client.query(
        `SELECT p.id, p.code, p.module, p.description
         FROM permissions p
         JOIN staff_job_type_permissions sjp ON sjp.permission_id = p.id
         WHERE sjp.staff_job_type_id = $1`,
        [targetJob.id]
      );

      return {
        id: updated.id,
        employeeNumber: updated.employee_number,
        name: `${updated.first_name} ${updated.last_name}`,
        staffJob: {
          id: targetJob.id,
          code: targetJob.code,
          name: targetJob.name,
          isActive: targetJob.is_active
        },
        permissions: permRes.rows.map(r => r.code),
        message: `Successfully changed staff job to "${targetJob.name}". New permissions applied immediately.`
      };
    });
  }

  /**
   * Admin: Toggle staff active/inactive status
   */
  async updateStaffStatus(employeeId, newStatus) {
    const validStatuses = ['active', 'inactive', 'terminated', 'on_leave'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
      error.statusCode = 422;
      throw error;
    }

    return withTransaction(async (client) => {
      const empRes = await client.query('SELECT * FROM employees WHERE id = $1 FOR UPDATE', [employeeId]);
      if (empRes.rowCount === 0) {
        const error = new Error(`Employee '${employeeId}' not found`);
        error.statusCode = 404;
        throw error;
      }
      const emp = empRes.rows[0];

      const res = await client.query(
        `UPDATE employees
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [newStatus, employeeId]
      );

      // If employee has linked user account, also reflect active state
      if (emp.user_id) {
        await client.query(
          `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [newStatus === 'active', emp.user_id]
        );
      }

      return res.rows[0];
    });
  }
}

module.exports = new StaffJobService();
