/**
 * Champions Club - Court Bookings Routes
 * Role: MEMBER 3 (Booking Engine Backend)
 */

const express = require('express');
const router = express.Router();
const bookingController = require('./bookingController');
const { optionalAuth } = require('../../middleware/auth');

// Public availability endpoint matching frontend contract
router.get('/availability', bookingController.getAvailability);

// Bookings management
router.post('/', optionalAuth, bookingController.create);
router.get('/', optionalAuth, bookingController.list);
router.get('/:id', optionalAuth, bookingController.getById);
router.patch('/:id/cancel', optionalAuth, bookingController.cancel);
router.post('/:id/participants', optionalAuth, bookingController.addParticipant);

module.exports = router;
