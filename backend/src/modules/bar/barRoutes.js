/**
 * Champions Club - Bar Operations Routes
 * Role: MEMBER 4 (Backend Operations - Bar POS, Kitchen & Tab Management)
 */

const express = require('express');
const router = express.Router();
const barController = require('./barController');

// --- BAR TABLES & MENU ---
router.get('/tables', (req, res, next) => barController.getTables(req, res, next));
router.get('/menu', (req, res, next) => barController.getMenu(req, res, next));

// --- BAR ORDERS & TABS ---
router.get('/orders', (req, res, next) => barController.getOrders(req, res, next));
router.post('/orders', (req, res, next) => barController.createOrder(req, res, next));
router.get('/orders/:id', (req, res, next) => barController.getOrderById(req, res, next));

// --- TAB ITEMS ---
router.post('/orders/:id/items', (req, res, next) => barController.addItemsToOrder(req, res, next));
router.patch('/orders/:id/items/:itemId', (req, res, next) => barController.updateOrderItem(req, res, next));

// --- KITCHEN STATUS & SETTLEMENT ---
router.patch('/orders/:id/status', (req, res, next) => barController.updateKitchenStatus(req, res, next));
router.post('/orders/:id/settle', (req, res, next) => barController.settleOrder(req, res, next));

module.exports = router;
