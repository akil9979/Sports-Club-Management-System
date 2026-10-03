/**
 * Champions Club - Authentication Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticate, authorize } = require('../../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/pin-login', authController.pinLogin);
router.get('/me', authenticate, authController.me);

// Admin-only User & Role Management Routes
router.get('/users', authenticate, authorize('admin'), authController.getUsers);
router.patch('/users/:id/role', authenticate, authorize('admin'), authController.updateRole);

module.exports = router;

