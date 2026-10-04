/**
 * Champions Club - Staff & Leave Operations Routes
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const express = require('express');
const router = express.Router();
const staffController = require('./staffController');
const { authenticate, authorize } = require('../../middleware/auth');

// Employees
router.get('/employees', authenticate, authorize('admin', 'manager', 'staff'), staffController.listEmployees);
router.post('/employees', authenticate, authorize('admin', 'manager'), staffController.createEmployee);
router.patch('/employees/:id', authenticate, authorize('admin', 'manager'), staffController.updateEmployee);

// Shifts
router.get('/shifts', authenticate, authorize('admin', 'manager', 'staff'), staffController.listShifts);
router.post('/shifts', authenticate, authorize('admin', 'manager'), staffController.createShift);

// Leave Requests
router.get('/leave-requests', authenticate, authorize('admin', 'manager', 'staff'), staffController.listLeaveRequests);
router.post('/leave-requests', authenticate, authorize('admin', 'manager', 'staff'), staffController.createLeaveRequest);
router.patch('/leave-requests/:id/approve', authenticate, authorize('admin', 'manager'), staffController.approveLeaveRequest);
router.patch('/leave-requests/:id/reject', authenticate, authorize('admin', 'manager'), staffController.rejectLeaveRequest);

module.exports = router;
