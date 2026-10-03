/**
 * Champions Club - Court Bookings Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const bookingController = require('./bookingController');
const { optionalAuth, authenticate } = require('../../middleware/auth');

// Public availability endpoint matching frontend contract
router.get('/availability', bookingController.getAvailability);

// Bookings management
router.post('/', optionalAuth, bookingController.create);
router.get('/', optionalAuth, bookingController.list);
router.patch('/:id/cancel', authenticate, bookingController.cancel);

module.exports = router;
