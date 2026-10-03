/**
 * Champions Club - Shop Orders Service
 * Role: MEMBER 4 (Backend Operations)
 * 
 * Manages counter purchases, online pickup, and home deliveries with
 * atomic inventory deduction, row-level concurrency locks, and member discount calculation.
 */

const { query, withTransaction } = require('../../config/database');

class OrderService {
  /**
   * Create a new shop order with concurrency-safe stock deduction and member discounts
   */
  async createOrder({
    memberId = null,
    customerName = null,
    customerEmail = null,
    customerPhone = null,
    orderType = 'counter', // 'counter', 'online_pickup', 'online_delivery'
    fulfilmentType = null, // 'in_store', 'pickup', 'delivery'
    deliveryAddress = null,
    deliveryNotes = null,
    pickupTime = null,
    items = [], // Array of { productId, quantity, unitPrice (optional override) }
    paymentStatus = 'unpaid',
    userId = null
  }) {
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Order must contain at least one item');
      error.statusCode = 422;
      throw error;
    }

    // Standardize fulfilment type
    let effectiveFulfilment = fulfilmentType;
    if (!effectiveFulfilment) {
      if (orderType === 'online_delivery') effectiveFulfilment = 'delivery';
      else if (orderType === 'online_pickup') effectiveFulfilment = 'pickup';
      else effectiveFulfilment = 'in_store';
    }

    return withTransaction(async (client) => {
      // 1. Resolve Member & Pricing Tier
      let discountPct = 0;
      let memberInfo = null;

      if (memberId) {
        const memberRes = await client.query(
          `SELECT m.id, m.first_name, m.last_name, m.email, m.phone,
                  ms.status AS membership_status, mp.tier, mp.shop_discount_pct
           FROM members m
           LEFT JOIN memberships ms ON ms.member_id = m.id AND ms.status = 'active'
           LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
           WHERE m.id = $1 OR m.member_number = $1`,
          [memberId]
        );

        if (memberRes.rowCount === 0) {
          const error = new Error(`Member '${memberId}' not found`);
          error.statusCode = 404;
          throw error;
        }

        memberInfo = memberRes.rows[0];
        if (memberInfo.membership_status === 'active' && memberInfo.shop_discount_pct) {
          discountPct = parseFloat(memberInfo.shop_discount_pct);
        } else if (memberInfo.membership_status === 'active' && memberInfo.tier === 'Gold') {
          discountPct = 20.0;
        } else if (memberInfo.membership_status === 'active' && memberInfo.tier === 'Silver') {
          discountPct = 10.0;
        }
      }

      // Auto-fill customer details from member if not explicitly provided
      const resolvedName = customerName || (memberInfo ? `${memberInfo.first_name} ${memberInfo.last_name}` : 'Walk-in Customer');
      const resolvedEmail = customerEmail || memberInfo?.email || null;
      const resolvedPhone = customerPhone || memberInfo?.phone || null;

      // 2. Fetch and Lock Products & Inventory in a deterministic order to prevent deadlocks
      const productIds = Array.from(new Set(items.map(i => i.productId))).sort();

      const productsRes = await client.query(
        `SELECT p.id, p.name, p.price, p.member_price, p.is_active,
                inv.quantity_on_hand, inv.reorder_threshold
         FROM products p
         JOIN inventory inv ON inv.product_id = p.id
         WHERE p.id = ANY($1)
         FOR UPDATE OF inv`,
        [productIds]
      );

      const productMap = new Map();
      productsRes.rows.forEach(p => productMap.set(p.id, p));

      // 3. Validate Stock & Calculate Line Items
      let calculatedSubtotal = 0;
      let calculatedDiscount = 0;
      const processedItems = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          const error = new Error(`Product '${item.productId}' does not exist in catalog`);
          error.statusCode = 404;
          throw error;
        }

        if (!product.is_active) {
          const error = new Error(`Product '${product.name}' is currently inactive`);
          error.statusCode = 400;
          throw error;
        }

        const requestedQty = parseInt(item.quantity, 10);
        if (requestedQty <= 0) {
          const error = new Error(`Quantity for product '${product.name}' must be greater than 0`);
          error.statusCode = 422;
          throw error;
        }

        if (product.quantity_on_hand < requestedQty) {
          const error = new Error(`Insufficient shelf stock for '${product.name}'. Available: ${product.quantity_on_hand}, Requested: ${requestedQty}`);
          error.statusCode = 409;
          throw error;
        }

        // Pricing calculation:
        const retailPrice = parseFloat(product.price);
        let effectiveUnitPrice = retailPrice;

        if (memberInfo && memberInfo.membership_status === 'active') {
          if (discountPct > 0) {
            effectiveUnitPrice = Math.round(retailPrice * (1 - discountPct / 100) * 100) / 100;
          } else if (product.member_price !== null) {
            effectiveUnitPrice = parseFloat(product.member_price);
          }
        }

        const lineSubtotal = retailPrice * requestedQty;
        const lineTotal = effectiveUnitPrice * requestedQty;
        const lineDiscount = lineSubtotal - lineTotal;

        calculatedSubtotal += lineSubtotal;
        calculatedDiscount += lineDiscount;

        processedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: requestedQty,
          retailPrice,
          unitPrice: effectiveUnitPrice,
          totalPrice: lineTotal
        });

        // Decrement local map for checking multiple lines of the same item
        product.quantity_on_hand -= requestedQty;
      }

      const calculatedTax = Math.round((calculatedSubtotal - calculatedDiscount) * 0.05 * 100) / 100; // 5% GST on sports goods
      const calculatedTotal = (calculatedSubtotal - calculatedDiscount) + calculatedTax;

      // 4. Generate Order Number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `SO-${new Date().getFullYear()}-${randSuffix}`;

      // 5. Insert Shop Order
      const orderInsert = await client.query(
        `INSERT INTO shop_orders (
            order_number, member_id, customer_name, customer_email, customer_phone,
            order_type, fulfilment_type, delivery_address, delivery_notes, pickup_time,
            status, subtotal, discount_amount, tax_amount, total_amount, payment_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          orderNumber,
          memberInfo ? memberInfo.id : null,
          resolvedName,
          resolvedEmail,
          resolvedPhone,
          orderType,
          effectiveFulfilment,
          deliveryAddress,
          deliveryNotes,
          pickupTime ? new Date(pickupTime).toISOString() : null,
          calculatedSubtotal,
          calculatedDiscount,
          calculatedTax,
          calculatedTotal,
          paymentStatus
        ]
      );

      const createdOrder = orderInsert.rows[0];

      // 6. Insert Order Items & Deduct Inventory & Record Stock Movements
      for (const item of processedItems) {
        // Insert line item
        await client.query(
          `INSERT INTO shop_order_items (shop_order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [createdOrder.id, item.productId, item.quantity, item.unitPrice, item.totalPrice]
        );

        // Deduct inventory
        await client.query(
          `UPDATE inventory 
           SET quantity_on_hand = quantity_on_hand - $1, updated_at = CURRENT_TIMESTAMP 
           WHERE product_id = $2`,
          [item.quantity, item.productId]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
           VALUES ($1, 'sale', $2, $3, $4, $5)`,
          [
            item.productId,
            -item.quantity,
            createdOrder.order_number,
            `${orderType.toUpperCase()} order sale to ${resolvedName}`,
            userId
          ]
        );
      }

      return {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        memberId: createdOrder.member_id,
        customerName: createdOrder.customer_name,
        customerEmail: createdOrder.customer_email,
        customerPhone: createdOrder.customer_phone,
        orderType: createdOrder.order_type,
        fulfilmentType: createdOrder.fulfilment_type,
        deliveryAddress: createdOrder.delivery_address,
        deliveryNotes: createdOrder.delivery_notes,
        pickupTime: createdOrder.pickup_time,
        status: createdOrder.status,
        subtotal: parseFloat(createdOrder.subtotal),
        discountAmount: parseFloat(createdOrder.discount_amount),
        taxAmount: parseFloat(createdOrder.tax_amount),
        totalAmount: parseFloat(createdOrder.total_amount),
        paymentStatus: createdOrder.payment_status,
        items: processedItems,
        createdAt: createdOrder.created_at
      };
    });
  }

  /**
   * List shop orders with filters
   */
  async getOrders({ memberId = null, status = null, orderType = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT so.id, so.order_number, so.member_id, so.customer_name, so.customer_email, so.customer_phone,
             so.order_type, so.fulfilment_type, so.delivery_address, so.pickup_time,
             so.status, so.subtotal, so.discount_amount, so.tax_amount, so.total_amount,
             so.payment_status, so.created_at, so.updated_at,
             COUNT(soi.id) AS total_items,
             COALESCE(SUM(soi.quantity), 0) AS total_quantity
      FROM shop_orders so
      LEFT JOIN shop_order_items soi ON soi.shop_order_id = so.id
      WHERE 1=1
    `;
    const params = [];

    if (memberId) {
      params.push(memberId);
      sql += ` AND so.member_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND so.status = $${params.length}`;
    }

    if (orderType) {
      params.push(orderType);
      sql += ` AND so.order_type = $${params.length}`;
    }

    sql += ` GROUP BY so.id ORDER BY so.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);

    return res.rows.map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      memberId: row.member_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      orderType: row.order_type,
      fulfilmentType: row.fulfilment_type,
      deliveryAddress: row.delivery_address,
      pickupTime: row.pickup_time,
      status: row.status,
      subtotal: parseFloat(row.subtotal),
      discountAmount: parseFloat(row.discount_amount),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      paymentStatus: row.payment_status,
      totalItems: parseInt(row.total_items, 10),
      totalQuantity: parseInt(row.total_quantity, 10),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Get complete order details by ID or order_number
   */
  async getOrderById(orderId, client = null) {
    const dbRunner = client || { query };
    const orderRes = await dbRunner.query(
      `SELECT so.id, so.order_number, so.member_id, so.customer_name, so.customer_email, so.customer_phone,
              so.order_type, so.fulfilment_type, so.delivery_address, so.delivery_notes, so.pickup_time,
              so.status, so.subtotal, so.discount_amount, so.tax_amount, so.total_amount,
              so.payment_status, so.created_at, so.updated_at,
              m.member_number, mp.tier AS member_tier
       FROM shop_orders so
       LEFT JOIN members m ON m.id = so.member_id
       LEFT JOIN memberships ms ON ms.member_id = m.id AND ms.status = 'active'
       LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
       WHERE so.id::text = $1 OR so.order_number = $1`,
      [orderId]
    );

    if (orderRes.rowCount === 0) {
      const error = new Error(`Shop order '${orderId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const order = orderRes.rows[0];

    // Fetch line items with product details
    const itemsRes = await dbRunner.query(
      `SELECT soi.id, soi.product_id, soi.quantity, soi.unit_price, soi.total_price,
              p.name AS product_name, p.sku, p.image_url, pc.name AS category
       FROM shop_order_items soi
       JOIN products p ON p.id = soi.product_id
       JOIN product_categories pc ON pc.id = p.category_id
       WHERE soi.shop_order_id = $1`,
      [order.id]
    );

    return {
      id: order.id,
      orderNumber: order.order_number,
      memberId: order.member_id,
      memberNumber: order.member_number,
      memberTier: order.member_tier,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      orderType: order.order_type,
      fulfilmentType: order.fulfilment_type,
      deliveryAddress: order.delivery_address,
      deliveryNotes: order.delivery_notes,
      pickupTime: order.pickup_time,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      discountAmount: parseFloat(order.discount_amount),
      taxAmount: parseFloat(order.tax_amount),
      totalAmount: parseFloat(order.total_amount),
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemsRes.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        category: item.category,
        imageUrl: item.image_url,
        quantity: parseInt(item.quantity, 10),
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price)
      }))
    };
  }

  /**
   * Update order status with atomic stock restoration if cancelled
   */
  async updateOrderStatus(orderId, nextStatus, notes = null, userId = null) {
    return withTransaction(async (client) => {
      // 1. Lock order row
      const orderRes = await client.query(
        'SELECT * FROM shop_orders WHERE id::text = $1 OR order_number = $1 FOR UPDATE',
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        const error = new Error(`Shop order '${orderId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const order = orderRes.rows[0];
      const previousStatus = order.status;

      if (previousStatus === nextStatus) {
        return this.getOrderById(order.id);
      }

      // If already cancelled or refunded, do not allow re-cancelling
      if (previousStatus === 'cancelled' && nextStatus === 'cancelled') {
        const error = new Error('Order is already cancelled');
        error.statusCode = 400;
        throw error;
      }

      // 2. If cancelling, restore inventory and log return stock movements
      if (nextStatus === 'cancelled' && previousStatus !== 'cancelled') {
        const itemsRes = await client.query(
          'SELECT product_id, quantity FROM shop_order_items WHERE shop_order_id = $1',
          [order.id]
        );

        for (const item of itemsRes.rows) {
          // Add back stock
          await client.query(
            `UPDATE inventory 
             SET quantity_on_hand = quantity_on_hand + $1, updated_at = CURRENT_TIMESTAMP 
             WHERE product_id = $2`,
            [item.quantity, item.product_id]
          );

          // Log return stock movement
          await client.query(
            `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
             VALUES ($1, 'return', $2, $3, $4, $5)`,
            [
              item.product_id,
              item.quantity,
              order.order_number,
              `Restock from cancelled order ${order.order_number}${notes ? ': ' + notes : ''}`,
              userId
            ]
          );
        }
      }

      // 3. Update order status
      await client.query(
        'UPDATE shop_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [nextStatus, order.id]
      );

      return this.getOrderById(order.id, client);
    });
  }
}

module.exports = new OrderService();
