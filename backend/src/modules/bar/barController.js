/**
 * Champions Club - Bar Operations Controller
 * Role: MEMBER 4 (Backend Operations - Bar POS & Kitchen Management)
 */

const barService = require('./barService');
const {
  validateCreateOrder,
  validateAddItems,
  validateUpdateItem,
  validateUpdateStatus,
  validateSettlement
} = require('./barValidators');

class BarController {
  // GET /api/bar/tables
  async getTables(req, res, next) {
    try {
      const tables = await barService.getTables();
      res.status(200).json(tables);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/bar/menu
  async getMenu(req, res, next) {
    try {
      const menu = await barService.getMenu(req.query.category);
      res.status(200).json(menu);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/bar/orders
  async getOrders(req, res, next) {
    try {
      const orders = await barService.getOrders(req.query);
      res.status(200).json(orders);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/bar/orders/:id
  async getOrderById(req, res, next) {
    try {
      const order = await barService.getOrderById(req.params.id);
      res.status(200).json({ success: true, order, data: order });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/bar/orders
  async createOrder(req, res, next) {
    try {
      const validation = validateCreateOrder(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid order parameters',
          errors: validation.errors
        });
      }

      const order = await barService.createOrder(req.body);
      res.status(201).json({
        success: true,
        order,
        data: order,
        message: 'Bar tab created successfully'
      });
    } catch (err) {
      if (err.code === 'TABLE_ALREADY_ACTIVE' || err.statusCode === 409) {
        return res.status(409).json({
          success: false,
          error: 'Table Active',
          message: err.message,
          code: 'TABLE_ALREADY_ACTIVE'
        });
      }
      next(err);
    }
  }

  // POST /api/bar/orders/:id/items
  async addItemsToOrder(req, res, next) {
    try {
      const validation = validateAddItems(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid items payload',
          errors: validation.errors
        });
      }

      const order = await barService.addItemsToOrder(req.params.id, req.body.items);
      res.status(200).json({
        success: true,
        order,
        data: order,
        message: 'Items added to tab successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/bar/orders/:id/items/:itemId
  async updateOrderItem(req, res, next) {
    try {
      const validation = validateUpdateItem(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid item update payload',
          errors: validation.errors
        });
      }

      const order = await barService.updateOrderItem(req.params.id, req.params.itemId, req.body);
      res.status(200).json({
        success: true,
        order,
        data: order,
        message: 'Item updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/bar/orders/:id/status
  async updateKitchenStatus(req, res, next) {
    try {
      const validation = validateUpdateStatus(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid status parameter',
          errors: validation.errors
        });
      }

      const statusVal = req.body.kitchenStatus || req.body.status;
      const order = await barService.updateKitchenStatus(req.params.id, statusVal);
      res.status(200).json({
        success: true,
        order,
        data: order,
        kitchenStatus: order.kitchenStatus,
        status: order.kitchenStatus,
        message: `Order kitchen status updated to ${order.kitchenStatus}`
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/bar/orders/:id/settle
  async settleOrder(req, res, next) {
    try {
      const validation = validateSettlement(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid settlement details',
          errors: validation.errors
        });
      }

      const result = await barService.settleOrder(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      if (err.statusCode === 409 || err.message.includes('already settled')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: err.message
        });
      }
      next(err);
    }
  }
}

module.exports = new BarController();
