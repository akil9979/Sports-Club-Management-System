/**
 * Champions Club - Members Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const memberController = require('./memberController');
const { authenticate, authorize, optionalAuth } = require('../../middleware/auth');
const bookingController = require('../bookings/bookingController');

// Member Management Endpoints
router.post('/', authenticate, authorize('admin', 'manager', 'staff'), memberController.create);
router.get('/', authenticate, authorize('admin', 'manager', 'staff'), memberController.list);
router.get('/:id/booking-usage', optionalAuth, bookingController.getMemberUsage);
router.get('/:id', authenticate, memberController.getById);
router.patch('/:id', authenticate, memberController.update);

// Member-specific Membership Endpoints
router.post('/:id/memberships', authenticate, memberController.createMembership);
router.get('/:id/memberships', authenticate, memberController.getMemberships);

module.exports = router;
