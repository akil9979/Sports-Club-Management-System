/**
 * Champions Club - Shop, Catalogue & Inventory Routes
 * Role: MEMBER 4 (Backend Operations)
 */

const express = require('express');
const router = express.Router();
const shopController = require('./shopController');
const { authenticate, optionalAuth, authorize } = require('../../middleware/auth');

// --- PRODUCTS ---
// Public catalogue endpoint
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProductById);

// Protected catalogue management
router.post('/products', authenticate, authorize('admin', 'manager', 'staff'), shopController.createProduct);
router.patch('/products/:id', authenticate, authorize('admin', 'manager', 'staff'), shopController.updateProduct);

// --- INVENTORY ---
router.get('/inventory/low-stock', authenticate, authorize('admin', 'manager', 'staff'), shopController.getLowStock);
router.get('/inventory/movements', authenticate, authorize('admin', 'manager', 'staff'), shopController.getStockMovements);
router.get('/inventory', authenticate, authorize('admin', 'manager', 'staff'), shopController.getInventory);

// --- SHOP ORDERS ---
router.post('/shop/orders', optionalAuth, shopController.createOrder);
router.get('/shop/orders', optionalAuth, shopController.getOrders);
router.get('/shop/orders/:id', optionalAuth, shopController.getOrderById);
router.patch('/shop/orders/:id/status', authenticate, authorize('admin', 'manager', 'staff'), shopController.updateOrderStatus);

module.exports = router;
