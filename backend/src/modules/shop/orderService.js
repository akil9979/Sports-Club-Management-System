/**
 * Champions Club - Shop Orders Service
 * Role: MEMBER 4 (Backend Operations)
 */

const { query, withTransaction } = require('../../config/database');

function formatOrderSummary(row) {
  return {
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
    totalItems: parseInt(row.total_items || 0, 10),
    totalQuantity: parseInt(row.total_quantity || 0, 10),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class OrderService {
  /**
   * Create a new shop order with concurrency-safe stock deduction and member discounts
   */
  async createOrder({
    memberId = null,
    customerName = null,
    customerEmail = null,
    customerPhone = null,
    orderType = 'counter',
    fulfilmentType = null,
    deliveryAddress = null,
    deliveryNotes = null,
    pickupTime = null,
    items = [],
    paymentStatus = 'unpaid',
    userId = null
  }) {
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Order must contain at least one item');
      error.statusCode = 422;
      throw error;
    }

    const effectiveFulfilment = fulfilmentType || (orderType === 'online_delivery' ? 'delivery' : orderType === 'online_pickup' ? 'pickup' : 'in_store');

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
        if (memberInfo.membership_status === 'active') {
          if (memberInfo.shop_discount_pct) discountPct = parseFloat(memberInfo.shop_discount_pct);
          else if (memberInfo.tier === 'Gold') discountPct = 20.0;
          else if (memberInfo.tier === 'Silver') discountPct = 10.0;
        }
      }

      const resolvedName = customerName || (memberInfo ? `${memberInfo.first_name} ${memberInfo.last_name}` : 'Walk-in Customer');
      const resolvedEmail = customerEmail || memberInfo?.email || null;
      const resolvedPhone = customerPhone || memberInfo?.phone || null;

      // 2. Fetch and Lock Products & Inventory (sorted deterministically to prevent deadlocks)
      const productIds = Array.from(new Set(items.map(i => i.productId))).sort();
      const productsRes = await client.query(
        `SELECT p.id, p.name, p.price, p.member_price, p.is_active,
                inv.quantity_on_hand
         FROM products p
         JOIN inventory inv ON inv.product_id = p.id
         WHERE p.id = ANY($1)
         FOR UPDATE OF inv`,
        [productIds]
      );

      const productMap = new Map(productsRes.rows.map(p => [p.id, p]));

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
        calculatedSubtotal += lineSubtotal;
        calculatedDiscount += (lineSubtotal - lineTotal);

        processedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: requestedQty,
          retailPrice,
          unitPrice: effectiveUnitPrice,
          totalPrice: lineTotal
        });

        product.quantity_on_hand -= requestedQty;
      }

      const calculatedTax = Math.round((calculatedSubtotal - calculatedDiscount) * 0.05 * 100) / 100;
      const calculatedTotal = (calculatedSubtotal - calculatedDiscount) + calculatedTax;
      const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Insert Shop Order
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

      // 5. Insert Items, Deduct Inventory & Record Stock Movements
      for (const item of processedItems) {
        await client.query(
          `INSERT INTO shop_order_items (shop_order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [createdOrder.id, item.productId, item.quantity, item.unitPrice, item.totalPrice]
        );

        await client.query(
          `UPDATE inventory 
           SET quantity_on_hand = quantity_on_hand - $1, updated_at = CURRENT_TIMESTAMP 
           WHERE product_id = $2`,
          [item.quantity, item.productId]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
           VALUES ($1, 'sale', $2, $3, $4, $5)`,
          [item.productId, -item.quantity, createdOrder.order_number, `${orderType.toUpperCase()} order sale to ${resolvedName}`, userId]
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
      SELECT so.*, COUNT(soi.id) AS total_items, COALESCE(SUM(soi.quantity), 0) AS total_quantity
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
    return res.rows.map(formatOrderSummary);
  }

  /**
   * Get complete order details by ID or order_number
   */
  async getOrderById(orderId, client = null) {
    const db = client || { query };
    const orderRes = await db.query(
      `SELECT so.*, m.member_number, mp.tier AS member_tier
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
    const itemsRes = await db.query(
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

      if (previousStatus === 'cancelled' && nextStatus === 'cancelled') {
        const error = new Error('Order is already cancelled');
        error.statusCode = 400;
        throw error;
      }

      // If cancelling, restore inventory and log return movement
      if (nextStatus === 'cancelled' && previousStatus !== 'cancelled') {
        const itemsRes = await client.query(
          'SELECT product_id, quantity FROM shop_order_items WHERE shop_order_id = $1',
          [order.id]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE inventory 
             SET quantity_on_hand = quantity_on_hand + $1, updated_at = CURRENT_TIMESTAMP 
             WHERE product_id = $2`,
            [item.quantity, item.product_id]
          );

          await client.query(
            `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
             VALUES ($1, 'return', $2, $3, $4, $5)`,
            [item.product_id, item.quantity, order.order_number, `Restock from cancelled order ${order.order_number}${notes ? ': ' + notes : ''}`, userId]
          );
        }
      }

      await client.query(
        'UPDATE shop_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [nextStatus, order.id]
      );

      return this.getOrderById(order.id, client);
    });
  }
}

module.exports = new OrderService();
