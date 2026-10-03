/**
 * Champions Club - Members Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const memberController = require('./memberController');
const { authenticate, authorize } = require('../../middleware/auth');

// Member Management Endpoints
router.post('/', authenticate, authorize('admin', 'manager', 'staff'), memberController.create);
router.get('/', authenticate, authorize('admin', 'manager', 'staff'), memberController.list);
router.get('/:id', authenticate, memberController.getById);
router.patch('/:id', authenticate, memberController.update);

// Member-specific Membership Endpoints
router.post('/:id/memberships', authenticate, memberController.createMembership);
router.get('/:id/memberships', authenticate, memberController.getMemberships);

module.exports = router;
