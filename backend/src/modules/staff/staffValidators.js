/**
 * Champions Club - Staff & Leave Operations Validators
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const { validators } = require('../../middleware/validator');

const CANONICAL_DEPARTMENTS = ['management', 'bar', 'reception', 'sports_academy', 'maintenance', 'accounts'];
const CANONICAL_LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid', 'emergency'];
const CANONICAL_EMPLOYEE_STATUSES = ['active', 'inactive', 'terminated', 'on_leave'];

function validateCreateEmployee(body) {
  const errors = [];

  const firstName = body.firstName || body.first_name;
  const lastName = body.lastName || body.last_name;

  if (!validators.isNonEmptyString(firstName)) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!validators.isNonEmptyString(lastName)) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  if (!validators.isEmail(body.email)) {
    errors.push({ field: 'email', message: 'Valid corporate email address is required' });
  }

  if (!validators.isNonEmptyString(body.phone)) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  }

  if (!validators.isNonEmptyString(body.department) || !CANONICAL_DEPARTMENTS.includes(body.department)) {
    errors.push({
      field: 'department',
      message: `Department is required and must be one of: ${CANONICAL_DEPARTMENTS.join(', ')}`
    });
  }

  if (!validators.isNonEmptyString(body.designation)) {
    errors.push({ field: 'designation', message: 'Designation is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCreateShift(body) {
  const errors = [];

  const employeeId = body.employeeId || body.employee_id;
  if (!validators.isNonEmptyString(employeeId)) {
    errors.push({ field: 'employeeId', message: 'employeeId is required' });
  }

  const shiftDate = body.shiftDate || body.shift_date;
  if (!validators.isDateString(shiftDate)) {
    errors.push({ field: 'shiftDate', message: 'Valid shift date is required (YYYY-MM-DD)' });
  }

  const startTime = body.startTime || body.start_time;
  const endTime = body.endTime || body.end_time;

  if (!validators.isNonEmptyString(startTime) || Number.isNaN(new Date(startTime).getTime())) {
    errors.push({ field: 'startTime', message: 'Valid startTime is required' });
  }

  if (!validators.isNonEmptyString(endTime) || Number.isNaN(new Date(endTime).getTime())) {
    errors.push({ field: 'endTime', message: 'Valid endTime is required' });
  }

  if (startTime && endTime) {
    const s = new Date(startTime);
    const e = new Date(endTime);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
      if (e <= s) {
        errors.push({ field: 'endTime', message: 'Shift end time must be after start time' });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCreateLeaveRequest(body) {
  const errors = [];

  const employeeId = body.employeeId || body.employee_id;
  if (!validators.isNonEmptyString(employeeId)) {
    errors.push({ field: 'employeeId', message: 'employeeId is required' });
  }

  const leaveType = body.leaveType || body.leave_type;
  if (!validators.isNonEmptyString(leaveType) || !CANONICAL_LEAVE_TYPES.includes(leaveType)) {
    errors.push({
      field: 'leaveType',
      message: `leaveType must be one of: ${CANONICAL_LEAVE_TYPES.join(', ')}`
    });
  }

  const startDate = body.startDate || body.start_date;
  if (!validators.isDateString(startDate)) {
    errors.push({ field: 'startDate', message: 'Valid start date (YYYY-MM-DD) is required' });
  }

  const endDate = body.endDate || body.end_date;
  if (!validators.isDateString(endDate)) {
    errors.push({ field: 'endDate', message: 'Valid end date (YYYY-MM-DD) is required' });
  }

  if (validators.isDateString(startDate) && validators.isDateString(endDate)) {
    if (endDate < startDate) {
      errors.push({ field: 'endDate', message: 'End date must be on or after start date' });
    }
  }

  if (!validators.isNonEmptyString(body.reason)) {
    errors.push({ field: 'reason', message: 'Leave reason is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  CANONICAL_DEPARTMENTS,
  CANONICAL_LEAVE_TYPES,
  CANONICAL_EMPLOYEE_STATUSES,
  validateCreateEmployee,
  validateCreateShift,
  validateCreateLeaveRequest
};
