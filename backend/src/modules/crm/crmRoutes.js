/**
 * Champions Club - CRM & Lead Management Routes
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const express = require('express');
const router = express.Router();
const crmController = require('./crmController');
const { authenticate, authorize } = require('../../middleware/auth');

// Public enquiry submission
router.post('/', crmController.createLead);

// Protected staff/management CRM operations
router.get('/', authenticate, authorize('admin', 'manager', 'staff'), crmController.listLeads);
router.get('/:id', authenticate, authorize('admin', 'manager', 'staff'), crmController.getLeadById);
router.patch('/:id', authenticate, authorize('admin', 'manager', 'staff'), crmController.updateLead);

// Follow-ups
router.post('/:id/followups', authenticate, authorize('admin', 'manager', 'staff'), crmController.createFollowup);
router.get('/:id/followups', authenticate, authorize('admin', 'manager', 'staff'), crmController.getFollowups);

// Quotations & Trials
router.post('/:id/quotations', authenticate, authorize('admin', 'manager', 'staff'), crmController.createQuotation);
router.post('/:id/trials', authenticate, authorize('admin', 'manager', 'staff'), crmController.createTrial);

module.exports = router;
