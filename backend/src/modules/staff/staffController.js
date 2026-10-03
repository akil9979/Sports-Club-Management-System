/**
 * Champions Club - Staff & Leave Operations Controller
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const staffService = require('./staffService');
const {
  validateCreateEmployee,
  validateCreateShift,
  validateCreateLeaveRequest
} = require('./staffValidators');

class StaffController {
  async listEmployees(req, res, next) {
    try {
      const { department, status } = req.query;
      const employees = await staffService.getEmployees({ department, status });
      res.status(200).json(employees);
    } catch (err) {
      next(err);
    }
  }

  async createEmployee(req, res, next) {
    try {
      const validation = validateCreateEmployee(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid employee parameters',
          errors: validation.errors
        });
      }

      const employee = await staffService.createEmployee(req.body);
      res.status(201).json({
        success: true,
        data: employee,
        message: 'Employee registered successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await staffService.updateEmployee(id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Employee updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async listShifts(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const shifts = await staffService.getShifts(date);
      res.status(200).json(shifts);
    } catch (err) {
      next(err);
    }
  }

  async createShift(req, res, next) {
    try {
      const validation = validateCreateShift(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid shift parameters',
          errors: validation.errors
        });
      }

      const shift = await staffService.createShift(req.body);
      res.status(201).json({
        success: true,
        data: shift,
        message: 'Staff shift scheduled successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async listLeaveRequests(req, res, next) {
    try {
      const { status } = req.query;
      const requests = await staffService.getLeaveRequests(status);
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }

  async createLeaveRequest(req, res, next) {
    try {
      const validation = validateCreateLeaveRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid leave request parameters',
          errors: validation.errors
        });
      }

      const leave = await staffService.createLeaveRequest(req.body);
      res.status(201).json({
        success: true,
        data: leave,
        message: 'Leave request submitted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async approveLeaveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const approved = await staffService.approveLeaveRequest(id, req.user?.id);
      res.status(200).json({
        success: true,
        data: approved,
        message: 'Leave request approved successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectLeaveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const rejected = await staffService.rejectLeaveRequest(id, req.user?.id);
      res.status(200).json({
        success: true,
        data: rejected,
        message: 'Leave request rejected successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StaffController();
