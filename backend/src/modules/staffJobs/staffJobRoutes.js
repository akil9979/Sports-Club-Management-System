/**
 * Champions Club - Staff Jobs & Permission Management Routes
 * Role: Scalable Database-Driven Staff Job Access Control (JBAC)
 */

const express = require('express');
const router = express.Router();
const staffJobController = require('./staffJobController');
const { authenticate, requireAdmin } = require('../../middleware/auth');

// Public / Authenticated Staff Job Types (used by signup & dropdowns)
router.get('/staff-job-types', staffJobController.getActiveJobTypes);

// Admin-Only Staff Job Management
router.get('/admin/staff-job-types', authenticate, requireAdmin, staffJobController.getAllJobTypes);
router.post('/admin/staff-job-types', authenticate, requireAdmin, staffJobController.createJobType);
router.patch('/admin/staff-job-types/:id', authenticate, requireAdmin, staffJobController.updateJobType);

// Admin-Only System Permissions List
router.get('/admin/permissions', authenticate, requireAdmin, staffJobController.getAllPermissions);

// Admin-Only Staff Member Job Assignment & Status Management
router.get('/admin/staff', authenticate, requireAdmin, staffJobController.getStaffMembers);
router.patch('/admin/staff/:id/job', authenticate, requireAdmin, staffJobController.updateStaffJob);
router.patch('/admin/staff/:id/status', authenticate, requireAdmin, staffJobController.updateStaffStatus);

module.exports = router;
