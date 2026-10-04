/**
 * Champions Club - Shop, Catalogue & Inventory Routes
 * Role: MEMBER 4 (Backend Operations) & Staff Job-Based Access Control
 */

const express = require('express');
const router = express.Router();
const shopController = require('./shopController');
const { authenticate, optionalAuth, requirePermission } = require('../../middleware/auth');

// --- PRODUCTS ---
// Public catalogue endpoints
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProductById);

// Protected catalogue management (Job-Based Access Control)
router.post('/products', authenticate, requirePermission('products.create'), shopController.createProduct);
router.put('/products/:id', authenticate, requirePermission('products.update'), shopController.updateProduct);
router.patch('/products/:id', authenticate, requirePermission('products.update'), shopController.updateProduct);
router.delete('/products/:id', authenticate, requirePermission('products.delete'), shopController.deleteProduct);

// --- INVENTORY ---
router.get('/inventory/low-stock', authenticate, requirePermission('inventory.view'), shopController.getLowStock);
router.get('/inventory/movements', authenticate, requirePermission('stock_movements.view'), shopController.getStockMovements);
router.get('/stock-movements', authenticate, requirePermission('stock_movements.view'), shopController.getStockMovements);
router.post('/inventory/movements', authenticate, requirePermission('stock_movements.create'), shopController.recordStockMovement);
router.post('/stock-movements', authenticate, requirePermission('stock_movements.create'), shopController.recordStockMovement);
router.get('/inventory', authenticate, requirePermission('inventory.view'), shopController.getInventory);

// --- SHOP ORDERS ---
router.post('/shop/orders', optionalAuth, shopController.createOrder);
router.get('/shop/orders', optionalAuth, (req, res, next) => {
  // If request is made by a staff member, verify shop_orders.view permission
  if (req.user && req.user.role === 'staff') {
    return requirePermission('shop_orders.view')(req, res, next);
  }
  next();
}, shopController.getOrders);

router.get('/shop/orders/:id', optionalAuth, shopController.getOrderById);
router.patch('/shop/orders/:id/status', authenticate, requirePermission('shop_orders.update'), shopController.updateOrderStatus);

module.exports = router;
