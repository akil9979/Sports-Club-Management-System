/**
 * Champions Club - Shop & Inventory Controller
 * Role: MEMBER 4 (Backend Operations)
 */

const productService = require('./productService');
const inventoryService = require('./inventoryService');
const orderService = require('./orderService');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateShopOrder,
  validateUpdateOrderStatus
} = require('./shopValidators');

class ShopController {
  // --- PRODUCTS ---

  async getProducts(req, res, next) {
    try {
      const { category, search, sport, inStock, lowStock, limit, offset } = req.query;
      const products = await productService.getProducts({
        category,
        search,
        sport,
        inStock,
        lowStock,
        limit,
        offset
      });
      // Return plain array matching frontend contract
      res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const validation = validateCreateProduct(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid product details',
          errors: validation.errors
        });
      }

      const product = await productService.createProduct({
        ...req.body,
        userId: req.user?.id || null
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created and inventory shelf initialized'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const validation = validateUpdateProduct(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid product update details',
          errors: validation.errors
        });
      }

      const product = await productService.updateProduct(
        req.params.id,
        req.body,
        req.user?.id || null
      );

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  // --- INVENTORY ---

  async getInventory(req, res, next) {
    try {
      const { category, lowStockOnly, limit, offset } = req.query;
      const inventory = await inventoryService.getInventory({
        category,
        lowStockOnly,
        limit,
        offset
      });
      res.status(200).json({
        success: true,
        data: inventory,
        count: inventory.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const lowStockItems = await inventoryService.getLowStockItems();
      res.status(200).json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
        message: `${lowStockItems.length} products currently below or at reorder threshold`
      });
    } catch (err) {
      next(err);
    }
  }

  async getStockMovements(req, res, next) {
    try {
      const { productId, limit, offset } = req.query;
      const movements = await inventoryService.getStockMovements({ productId, limit, offset });
      res.status(200).json({
        success: true,
        data: movements,
        count: movements.length
      });
    } catch (err) {
      next(err);
    }
  }

  // --- ORDERS ---

  async createOrder(req, res, next) {
    try {
      const validation = validateCreateShopOrder(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid order parameters',
          errors: validation.errors
        });
      }

      // Member ID can come from authenticated user or payload
      const effectiveMemberId = req.user?.memberId || req.body.memberId || null;

      const order = await orderService.createOrder({
        ...req.body,
        memberId: effectiveMemberId,
        userId: req.user?.id || null
      });

      res.status(201).json({
        success: true,
        data: order,
        message: 'Shop order placed and shelf inventory deducted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req, res, next) {
    try {
      const { status, orderType, limit, offset } = req.query;
      const memberId = req.user?.role === 'member' ? req.user.memberId : req.query.memberId;

      const orders = await orderService.getOrders({
        memberId,
        status,
        orderType,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const validation = validateUpdateOrderStatus(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid status update',
          errors: validation.errors
        });
      }

      const { status, notes } = req.body;
      const updated = await orderService.updateOrderStatus(
        req.params.id,
        status,
        notes,
        req.user?.id || null
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: `Order status updated to '${status}'`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ShopController();
