/**
 * Champions Club - Bar Operations Routes
 * Role: MEMBER 4 (Backend Operations - Bar POS, Kitchen & Tab Management) & JBAC Security
 */

const express = require('express');
const router = express.Router();
const barController = require('./barController');
const { authenticate, optionalAuth, requirePermission } = require('../../middleware/auth');

// --- BAR TABLES & MENU ---
// Table layout view requires bar_tables.view permission
router.get('/tables', authenticate, requirePermission('bar_tables.view'), (req, res, next) => barController.getTables(req, res, next));
// Menu can be browsed publicly or within bar terminal
router.get('/menu', optionalAuth, (req, res, next) => barController.getMenu(req, res, next));

// --- BAR ORDERS & TABS (Job-Based Access Control) ---
router.get('/orders', authenticate, requirePermission('bar_orders.view'), (req, res, next) => barController.getOrders(req, res, next));
router.post('/orders', authenticate, requirePermission('bar_orders.create'), (req, res, next) => barController.createOrder(req, res, next));
router.get('/orders/:id', authenticate, requirePermission('bar_orders.view'), (req, res, next) => barController.getOrderById(req, res, next));

// --- TAB ITEMS ---
router.post('/orders/:id/items', authenticate, requirePermission('bar_orders.update'), (req, res, next) => barController.addItemsToOrder(req, res, next));
router.patch('/orders/:id/items/:itemId', authenticate, requirePermission('bar_orders.update'), (req, res, next) => barController.updateOrderItem(req, res, next));

// --- KITCHEN STATUS & SETTLEMENT ---
router.patch('/orders/:id/status', authenticate, requirePermission('bar_orders.update'), (req, res, next) => barController.updateKitchenStatus(req, res, next));
router.post('/orders/:id/settle', authenticate, requirePermission('bar_orders.update'), (req, res, next) => barController.settleOrder(req, res, next));

module.exports = router;
