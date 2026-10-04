/**
 * Champions Club - Staff & Leave Operations Service
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const { query, withTransaction } = require('../../config/database');

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

class StaffService {
  /**
   * Get list of employees with optional department or status filtering
   */
  async getEmployees({ department, status } = {}) {
    let sql = `
      SELECT e.id, e.user_id, e.employee_number, e.first_name, e.last_name,
             e.email, e.phone, e.department, e.designation, e.pin,
             e.hourly_rate, e.salary, e.employment_type, e.status, e.joined_date,
             e.created_at, e.updated_at
      FROM employees e
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'all') {
      params.push(department.toLowerCase());
      sql += ` AND LOWER(e.department) = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status.toLowerCase());
      sql += ` AND LOWER(e.status) = $${params.length}`;
    }

    sql += ` ORDER BY e.joined_date ASC, e.employee_number ASC`;

    const res = await query(sql, params);

    return res.rows.map(e => ({
      id: e.id,
      userId: e.user_id,
      user_id: e.user_id,
      employeeNumber: e.employee_number,
      employee_number: e.employee_number,
      firstName: e.first_name,
      first_name: e.first_name,
      lastName: e.last_name,
      last_name: e.last_name,
      name: `${e.first_name} ${e.last_name}`,
      email: e.email,
      phone: e.phone,
      department: e.department,
      designation: e.designation,
      pin: e.pin,
      hourlyRate: parseFloat(e.hourly_rate || 0),
      hourly_rate: parseFloat(e.hourly_rate || 0),
      salary: parseFloat(e.salary || 0),
      employmentType: e.employment_type,
      employment_type: e.employment_type,
      status: e.status,
      joinedDate: e.joined_date,
      joined_date: e.joined_date,
      createdAt: e.created_at,
      updatedAt: e.updated_at
    }));
  }

  /**
   * Create new employee record
   */
  async createEmployee({
    id = null,
    employeeNumber = null,
    employee_number = null,
    firstName,
    first_name = null,
    lastName,
    last_name = null,
    email,
    phone,
    department,
    designation,
    pin = null,
    hourlyRate = 0.00,
    hourly_rate = 0.00,
    salary = 0.00,
    employmentType = 'full_time',
    employment_type = 'full_time',
    status = 'active',
    joinedDate = null,
    joined_date = null
  }) {
    const fName = (first_name || firstName).trim();
    const lName = (last_name || lastName).trim();
    const empEmail = email.trim();
    const empPhone = phone.trim();
    const hRate = parseFloat(hourly_rate || hourlyRate || 0);
    const sal = parseFloat(salary || 0);
    const empType = employment_type || employmentType || 'full_time';
    const jDate = joined_date || joinedDate || new Date().toISOString().split('T')[0];

    // Check duplicate email
    const dupCheck = await query('SELECT id FROM employees WHERE email = $1', [empEmail]);
    if (dupCheck.rowCount > 0) {
      const error = new Error(`An employee with email '${empEmail}' already exists`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    // Auto-generate employee number and ID if not provided
    const countRes = await query('SELECT COUNT(*) AS count FROM employees');
    const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
    const empId = id || `STF-${String(nextSeq).padStart(3, '0')}`;
    const empNumber = employee_number || employeeNumber || `EMP-2026-${String(nextSeq).padStart(3, '0')}`;

    const res = await query(
      `INSERT INTO employees (
          id, employee_number, first_name, last_name, email, phone,
          department, designation, pin, hourly_rate, salary, employment_type,
          status, joined_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [empId, empNumber, fName, lName, empEmail, empPhone, department, designation, pin, hRate, sal, empType, status, jDate]
    );

    const e = res.rows[0];
    return {
      id: e.id,
      employeeNumber: e.employee_number,
      employee_number: e.employee_number,
      firstName: e.first_name,
      first_name: e.first_name,
      lastName: e.last_name,
      last_name: e.last_name,
      name: `${e.first_name} ${e.last_name}`,
      email: e.email,
      phone: e.phone,
      department: e.department,
      designation: e.designation,
      pin: e.pin,
      hourlyRate: parseFloat(e.hourly_rate || 0),
      hourly_rate: parseFloat(e.hourly_rate || 0),
      salary: parseFloat(e.salary || 0),
      employmentType: e.employment_type,
      employment_type: e.employment_type,
      status: e.status,
      joinedDate: e.joined_date,
      joined_date: e.joined_date,
      createdAt: e.created_at,
      updatedAt: e.updated_at
    };
  }

  /**
   * Update employee details
   */
  async updateEmployee(employeeId, updates = {}) {
    const existing = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    if (existing.rowCount === 0) {
      const error = new Error(`Employee '${employeeId}' not found`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    const fields = [];
    const values = [];

    const fName = updates.firstName !== undefined ? updates.firstName : updates.first_name;
    if (fName !== undefined) {
      values.push(fName.trim());
      fields.push(`first_name = $${values.length}`);
    }
    const lName = updates.lastName !== undefined ? updates.lastName : updates.last_name;
    if (lName !== undefined) {
      values.push(lName.trim());
      fields.push(`last_name = $${values.length}`);
    }
    if (updates.email !== undefined) {
      values.push(updates.email.trim());
      fields.push(`email = $${values.length}`);
    }
    if (updates.phone !== undefined) {
      values.push(updates.phone.trim());
      fields.push(`phone = $${values.length}`);
    }
    if (updates.department !== undefined) {
      values.push(updates.department);
      fields.push(`department = $${values.length}`);
    }
    if (updates.designation !== undefined) {
      values.push(updates.designation);
      fields.push(`designation = $${values.length}`);
    }
    if (updates.pin !== undefined) {
      values.push(updates.pin);
      fields.push(`pin = $${values.length}`);
    }
    const hRate = updates.hourlyRate !== undefined ? updates.hourlyRate : updates.hourly_rate;
    if (hRate !== undefined) {
      values.push(parseFloat(hRate || 0));
      fields.push(`hourly_rate = $${values.length}`);
    }
    if (updates.salary !== undefined) {
      values.push(parseFloat(updates.salary || 0));
      fields.push(`salary = $${values.length}`);
    }
    const empType = updates.employmentType !== undefined ? updates.employmentType : updates.employment_type;
    if (empType !== undefined) {
      values.push(empType);
      fields.push(`employment_type = $${values.length}`);
    }
    if (updates.status !== undefined) {
      values.push(updates.status);
      fields.push(`status = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.getEmployees();
    }

    values.push(employeeId);
    const sql = `
      UPDATE employees
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;

    const res = await query(sql, values);
    const e = res.rows[0];

    return {
      id: e.id,
      employeeNumber: e.employee_number,
      employee_number: e.employee_number,
      firstName: e.first_name,
      first_name: e.first_name,
      lastName: e.last_name,
      last_name: e.last_name,
      name: `${e.first_name} ${e.last_name}`,
      email: e.email,
      phone: e.phone,
      department: e.department,
      designation: e.designation,
      pin: e.pin,
      hourlyRate: parseFloat(e.hourly_rate || 0),
      hourly_rate: parseFloat(e.hourly_rate || 0),
      salary: parseFloat(e.salary || 0),
      employmentType: e.employment_type,
      employment_type: e.employment_type,
      status: e.status,
      joinedDate: e.joined_date,
      joined_date: e.joined_date,
      createdAt: e.created_at,
      updatedAt: e.updated_at
    };
  }

  /**
   * Get shift roster for specific date
   */
  async getShifts(date = new Date().toISOString().split('T')[0]) {
    const res = await query(
      `SELECT s.id, s.employee_id, e.first_name, e.last_name, e.department, e.designation,
              s.shift_date, s.start_time, s.end_time, s.actual_clock_in, s.actual_clock_out,
              s.status, s.notes, s.created_at
       FROM staff_shifts s
       JOIN employees e ON e.id = s.employee_id
       WHERE s.shift_date = $1
       ORDER BY s.start_time ASC`,
      [date]
    );

    return res.rows.map(s => ({
      id: s.id,
      employeeId: s.employee_id,
      employee_id: s.employee_id,
      employeeName: `${s.first_name} ${s.last_name}`,
      department: s.department,
      designation: s.designation,
      shiftDate: s.shift_date,
      shift_date: s.shift_date,
      date: s.shift_date,
      startTime: s.start_time,
      start_time: s.start_time,
      endTime: s.end_time,
      end_time: s.end_time,
      actualClockIn: s.actual_clock_in,
      actual_clock_in: s.actual_clock_in,
      actualClockOut: s.actual_clock_out,
      actual_clock_out: s.actual_clock_out,
      status: s.status,
      notes: s.notes,
      createdAt: s.created_at
    }));
  }

  /**
   * Schedule a new staff shift
   */
  async createShift({
    employeeId,
    employee_id = null,
    shiftDate,
    shift_date = null,
    startTime,
    start_time = null,
    endTime,
    end_time = null,
    notes = null
  }) {
    const empId = employee_id || employeeId;
    const date = shift_date || shiftDate;
    const start = start_time || startTime;
    const end = end_time || endTime;

    const empRes = await query('SELECT id, first_name, last_name, department, designation FROM employees WHERE id = $1', [empId]);
    if (empRes.rowCount === 0) {
      const error = new Error(`Employee '${empId}' not found`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }
    const emp = empRes.rows[0];

    const s = new Date(start);
    const e = new Date(end);
    if (e <= s) {
      const error = new Error('Shift end time must be after start time');
      error.statusCode = 400;
      throw error;
    }

    const res = await query(
      `INSERT INTO staff_shifts (
          employee_id, shift_date, start_time, end_time, status, notes
       )
       VALUES ($1, $2, $3, $4, 'scheduled', $5)
       RETURNING *`,
      [empId, date, s.toISOString(), e.toISOString(), notes]
    );

    const shift = res.rows[0];
    return {
      id: shift.id,
      employeeId: shift.employee_id,
      employee_id: shift.employee_id,
      employeeName: `${emp.first_name} ${emp.last_name}`,
      department: emp.department,
      designation: emp.designation,
      shiftDate: shift.shift_date,
      shift_date: shift.shift_date,
      startTime: shift.start_time,
      start_time: shift.start_time,
      endTime: shift.end_time,
      end_time: shift.end_time,
      status: shift.status,
      notes: shift.notes,
      createdAt: shift.created_at
    };
  }

  /**
   * Submit a new leave request
   */
  async createLeaveRequest({
    employeeId,
    employee_id = null,
    leaveType,
    leave_type = null,
    startDate,
    start_date = null,
    endDate,
    end_date = null,
    reason
  }) {
    const empId = employee_id || employeeId;
    const type = leave_type || leaveType;
    const start = start_date || startDate;
    const end = end_date || endDate;

    // 1. Verify employee exists
    const empRes = await query('SELECT id, first_name, last_name, department, status FROM employees WHERE id = $1', [empId]);
    if (empRes.rowCount === 0) {
      const error = new Error(`Employee '${empId}' not found`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }
    const emp = empRes.rows[0];

    // 2. Validate date range
    if (end < start) {
      const error = new Error('End date must be on or after start date');
      error.statusCode = 400;
      error.code = 'INVALID_LEAVE_DATES';
      throw error;
    }

    // 3. Overlap check against pending and approved leave requests
    const overlapRes = await query(
      `SELECT id FROM leave_requests
       WHERE employee_id = $1
         AND status IN ('pending', 'approved')
         AND (start_date <= $3 AND end_date >= $2)
       LIMIT 1`,
      [empId, start, end]
    );

    if (overlapRes.rowCount > 0) {
      const error = new Error('An overlapping leave request already exists for this employee');
      error.statusCode = 409;
      error.code = 'LEAVE_OVERLAP';
      throw error;
    }

    // 4. Insert leave request
    const res = await query(
      `INSERT INTO leave_requests (
          employee_id, leave_type, start_date, end_date, reason, status
       )
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [empId, type, start, end, reason.trim()]
    );

    const lr = res.rows[0];
    return {
      id: lr.id,
      employeeId: lr.employee_id,
      employee_id: lr.employee_id,
      employeeName: `${emp.first_name} ${emp.last_name}`,
      department: emp.department,
      leaveType: lr.leave_type,
      leave_type: lr.leave_type,
      startDate: lr.start_date,
      start_date: lr.start_date,
      endDate: lr.end_date,
      end_date: lr.end_date,
      reason: lr.reason,
      status: lr.status,
      approvedBy: lr.approved_by,
      approved_by: lr.approved_by,
      createdAt: lr.created_at,
      updatedAt: lr.updated_at
    };
  }

  /**
   * Retrieve list of leave requests with optional status filter
   */
  async getLeaveRequests(status = null) {
    let sql = `
      SELECT lr.id, lr.employee_id, e.first_name, e.last_name, e.department, e.designation,
             lr.leave_type, lr.start_date, lr.end_date, lr.reason, lr.status,
             lr.approved_by, lr.created_at, lr.updated_at,
             u.first_name AS approver_first_name, u.last_name AS approver_last_name
      FROM leave_requests lr
      JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN users u ON u.id = lr.approved_by
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status.toLowerCase());
      sql += ` AND LOWER(lr.status) = $${params.length}`;
    }

    sql += ` ORDER BY lr.created_at DESC`;

    const res = await query(sql, params);

    return res.rows.map(lr => ({
      id: lr.id,
      employeeId: lr.employee_id,
      employee_id: lr.employee_id,
      employeeName: `${lr.first_name} ${lr.last_name}`,
      department: lr.department,
      designation: lr.designation,
      leaveType: lr.leave_type,
      leave_type: lr.leave_type,
      startDate: lr.start_date,
      start_date: lr.start_date,
      endDate: lr.end_date,
      end_date: lr.end_date,
      reason: lr.reason,
      status: lr.status,
      approvedBy: lr.approver_first_name ? `${lr.approver_first_name} ${lr.approver_last_name}` : lr.approved_by,
      approved_by: lr.approved_by,
      createdAt: lr.created_at,
      updatedAt: lr.updated_at
    }));
  }

  /**
   * Approve a leave request (Requires Management Role)
   */
  async approveLeaveRequest(leaveId, adminUserId) {
    if (!isUUID(leaveId)) {
      const error = new Error(`Leave request '${leaveId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAVE_NOT_FOUND';
      throw error;
    }

    return withTransaction(async (client) => {
      const checkRes = await client.query('SELECT * FROM leave_requests WHERE id = $1 FOR UPDATE', [leaveId]);
      if (checkRes.rowCount === 0) {
        const error = new Error(`Leave request '${leaveId}' not found`);
        error.statusCode = 404;
        error.code = 'LEAVE_NOT_FOUND';
        throw error;
      }

      const existing = checkRes.rows[0];

      if (existing.status === 'approved') {
        const error = new Error('Leave request is already approved');
        error.statusCode = 400;
        error.code = 'ALREADY_APPROVED';
        throw error;
      }

      if (existing.status === 'rejected' || existing.status === 'cancelled') {
        const error = new Error(`Cannot approve leave request with status '${existing.status}'`);
        error.statusCode = 400;
        error.code = 'INVALID_LEAVE_STATUS_TRANSITION';
        throw error;
      }

      // Update leave request
      const updateRes = await client.query(
        `UPDATE leave_requests
         SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [adminUserId || null, leaveId]
      );
      const approved = updateRes.rows[0];

      // Update employee status to 'on_leave'
      await client.query(
        `UPDATE employees
         SET status = 'on_leave', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [approved.employee_id]
      );

      return {
        id: approved.id,
        employeeId: approved.employee_id,
        employee_id: approved.employee_id,
        leaveType: approved.leave_type,
        leave_type: approved.leave_type,
        startDate: approved.start_date,
        start_date: approved.start_date,
        endDate: approved.end_date,
        end_date: approved.end_date,
        reason: approved.reason,
        status: approved.status,
        approvedBy: approved.approved_by,
        approved_by: approved.approved_by,
        updatedAt: approved.updated_at
      };
    });
  }

  /**
   * Reject a leave request (Requires Management Role)
   */
  async rejectLeaveRequest(leaveId, adminUserId) {
    if (!isUUID(leaveId)) {
      const error = new Error(`Leave request '${leaveId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAVE_NOT_FOUND';
      throw error;
    }

    return withTransaction(async (client) => {
      const checkRes = await client.query('SELECT * FROM leave_requests WHERE id = $1 FOR UPDATE', [leaveId]);
      if (checkRes.rowCount === 0) {
        const error = new Error(`Leave request '${leaveId}' not found`);
        error.statusCode = 404;
        error.code = 'LEAVE_NOT_FOUND';
        throw error;
      }

      const existing = checkRes.rows[0];

      if (existing.status === 'rejected') {
        const error = new Error('Leave request is already rejected');
        error.statusCode = 400;
        error.code = 'ALREADY_REJECTED';
        throw error;
      }

      if (existing.status === 'approved' || existing.status === 'cancelled') {
        const error = new Error(`Cannot reject leave request with status '${existing.status}'`);
        error.statusCode = 400;
        error.code = 'INVALID_LEAVE_STATUS_TRANSITION';
        throw error;
      }

      const updateRes = await client.query(
        `UPDATE leave_requests
         SET status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [adminUserId || null, leaveId]
      );
      const rejected = updateRes.rows[0];

      return {
        id: rejected.id,
        employeeId: rejected.employee_id,
        employee_id: rejected.employee_id,
        leaveType: rejected.leave_type,
        leave_type: rejected.leave_type,
        startDate: rejected.start_date,
        start_date: rejected.start_date,
        endDate: rejected.end_date,
        end_date: rejected.end_date,
        reason: rejected.reason,
        status: rejected.status,
        approvedBy: rejected.approved_by,
        approved_by: rejected.approved_by,
        updatedAt: rejected.updated_at
      };
    });
  }
}

module.exports = new StaffService();
