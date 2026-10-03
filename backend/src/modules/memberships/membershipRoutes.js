/**
 * Champions Club - Membership Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const membershipController = require('./membershipController');
const { authenticate } = require('../../middleware/auth');

// Public endpoints
router.get('/', membershipController.getPlans);
router.get('/:id', membershipController.getPlanById);

// Authenticated subscription endpoint
router.post('/subscribe', authenticate, membershipController.subscribe);

module.exports = router;
