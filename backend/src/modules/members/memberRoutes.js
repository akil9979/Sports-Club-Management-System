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

// Frontdesk QR Verification & Attendance Check-In Endpoints
router.post('/verify-qr', optionalAuth, memberController.verifyQr);
router.get('/frontdesk/checkins', optionalAuth, memberController.getCheckIns);
router.post('/frontdesk/checkin', optionalAuth, memberController.checkIn);

router.get('/:id/booking-usage', optionalAuth, bookingController.getMemberUsage);
router.get('/:id/qr-pass', optionalAuth, memberController.getMemberQrPass);
router.get('/:id', authenticate, memberController.getById);
router.patch('/:id', authenticate, memberController.update);

// Member-specific Membership Endpoints
router.post('/:id/memberships', authenticate, memberController.createMembership);
router.get('/:id/memberships', authenticate, memberController.getMemberships);

module.exports = router;
