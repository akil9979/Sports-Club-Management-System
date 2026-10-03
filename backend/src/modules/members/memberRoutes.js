/**
 * Champions Club - Members Routes
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const express = require('express');
const router = express.Router();
const memberController = require('./memberController');
const { authenticate, authorize } = require('../../middleware/auth');

router.get('/', authenticate, authorize('admin', 'manager', 'staff'), memberController.list);
router.get('/:id', authenticate, memberController.getById);
router.patch('/:id', authenticate, memberController.update);

module.exports = router;
