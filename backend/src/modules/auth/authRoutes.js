/**
 * Champions Club - Authentication Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticate } = require('../../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/pin-login', authController.pinLogin);
router.get('/me', authenticate, authController.me);

module.exports = router;
