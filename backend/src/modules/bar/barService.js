/**
 * Champions Club - Bar Operations Service
 * Role: MEMBER 4 (Backend Operations - Tables, Menu, Tabs, Kitchen & Settlement)
 */

const { query, withTransaction } = require('../../config/database');

function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function calculateOrderFinancials(items = [], discountPercentage = 0) {
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = parseFloat(item.unitPrice !== undefined ? item.unitPrice : (item.unit_price || item.price || 0));
    const qty = parseInt(item.quantity || 1, 10);
    return sum + (unitPrice * qty);
  }, 0);

  const discountPct = Math.max(0, Math.min(100, parseFloat(discountPercentage || 0)));
  const discountAmount = round2((subtotal * discountPct) / 100);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = round2(discountedSubtotal * 0.05); // 5% Club Food & Beverage Tax
  const total = round2(discountedSubtotal + tax);

  return {
    subtotal: round2(subtotal),
    discountPercentage: discountPct,
    discountAmount,
    tax,
    total
  };
}

function formatTable(row) {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    section: row.section,
    capacity: row.capacity,
    status: row.status,
    isActive: row.is_active,
    currentOrderId: row.current_order_id || null,
    activeTabTotal: row.active_tab_total ? parseFloat(row.active_tab_total) : 0,
    memberId: row.member_id || null,
    memberName: row.member_name || (row.guest_name || null),
    membershipTier: row.membership_tier || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: parseFloat(row.price),
    memberPrice: parseFloat(row.member_price),
    description: row.description,
    prepTimeMinutes: row.prep_time_minutes,
    alcoholic: row.alcoholic,
    badge: row.badge,
    inStock: row.in_stock,
    stock: row.stock,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatOrder(orderRow, itemsRows = []) {
  const items = itemsRows.map(i => ({
    id: i.id,
    itemId: i.item_id,
    name: i.item_name || i.name,
    category: i.category,
    quantity: parseInt(i.quantity, 10),
    unitPrice: parseFloat(i.unit_price),
    price: parseFloat(i.unit_price),
    notes: i.notes || '',
    kitchenStatus: i.kitchen_status || 'PENDING',
    createdAt: i.created_at
  }));

  return {
    id: orderRow.id,
    tableId: orderRow.table_id,
    tableName: orderRow.table_name || (orderRow.table_id ? `Table ${orderRow.table_id}` : null),
    memberId: orderRow.member_id,
    memberName: orderRow.guest_name || orderRow.member_name || null,
    guestName: orderRow.guest_name,
    membershipTier: orderRow.membership_tier || 'Guest',
    status: orderRow.status,
    kitchenStatus: orderRow.kitchen_status,
    discountPercentage: parseFloat(orderRow.discount_percentage || 0),
    discountAmount: parseFloat(orderRow.discount_amount || 0),
    subtotal: parseFloat(orderRow.subtotal || 0),
    tax: parseFloat(orderRow.tax || 0),
    total: parseFloat(orderRow.total || 0),
    paymentMethod: orderRow.payment_method || null,
    settledAt: orderRow.settled_at || null,
    items,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at
  };
}

class BarService {
  /**
   * GET /api/bar/tables - List tables with active tab overlay
   */
  async getTables() {
    const res = await query(
      `SELECT t.*,
              o.id AS current_order_id,
              o.total AS active_tab_total,
              o.member_id,
              o.guest_name,
              o.membership_tier,
              CASE 
                WHEN o.id IS NOT NULL AND t.status = 'available' THEN 'occupied'
                ELSE t.status
              END AS dynamic_status
       FROM bar_tables t
       LEFT JOIN LATERAL (
         SELECT bo.id, bo.total, bo.member_id, bo.guest_name, bo.membership_tier
         FROM bar_orders bo
         WHERE bo.table_id = t.id AND bo.status = 'open'
         ORDER BY bo.created_at DESC
         LIMIT 1
       ) o ON true
       ORDER BY t.number ASC`
    );

    return res.rows.map(row => {
      const mapped = formatTable(row);
      if (row.dynamic_status) {
        mapped.status = row.dynamic_status;
      }
      return mapped;
    });
  }

  /**
   * GET /api/bar/menu - List menu items with optional category filter
   */
  async getMenu(category = '') {
    let sql = 'SELECT * FROM menu_items';
    const params = [];

    if (category && category.toLowerCase() !== 'all') {
      sql += ' WHERE LOWER(category) = LOWER($1)';
      params.push(category.trim());
    }

    sql += ' ORDER BY category ASC, name ASC';
    const res = await query(sql, params);
    return res.rows.map(formatMenuItem);
  }

  /**
   * GET /api/bar/orders - List orders with optional filters
   */
  async getOrders({ tableId = '', status = '' } = {}) {
    let sql = `
      SELECT bo.*, bt.name AS table_name
      FROM bar_orders bo
      LEFT JOIN bar_tables bt ON bt.id = bo.table_id
      WHERE 1=1
    `;
    const params = [];

    if (tableId) {
      params.push(tableId);
      sql += ` AND bo.table_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND bo.status = $${params.length}`;
    }

    sql += ' ORDER BY bo.created_at DESC';

    const ordersRes = await query(sql, params);
    if (ordersRes.rowCount === 0) return [];

    const orderIds = ordersRes.rows.map(r => r.id);
    const itemsRes = await query(
      `SELECT oi.*, mi.name AS item_name, mi.category
       FROM bar_order_items oi
       JOIN menu_items mi ON mi.id = oi.item_id
       WHERE oi.bar_order_id = ANY($1)
       ORDER BY oi.created_at ASC`,
      [orderIds]
    );

    const itemsByOrder = {};
    for (const item of itemsRes.rows) {
      if (!itemsByOrder[item.bar_order_id]) itemsByOrder[item.bar_order_id] = [];
      itemsByOrder[item.bar_order_id].push(item);
    }

    return ordersRes.rows.map(order => formatOrder(order, itemsByOrder[order.id] || []));
  }

  /**
   * GET /api/bar/orders/:id - Get single bar order
   */
  async getOrderById(id) {
    const orderRes = await query(
      `SELECT bo.*, bt.name AS table_name
       FROM bar_orders bo
       LEFT JOIN bar_tables bt ON bt.id = bo.table_id
       WHERE bo.id = $1`,
      [id]
    );

    if (orderRes.rowCount === 0) {
      const error = new Error(`Bar order '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const itemsRes = await query(
      `SELECT oi.*, mi.name AS item_name, mi.category
       FROM bar_order_items oi
       JOIN menu_items mi ON mi.id = oi.item_id
       WHERE oi.bar_order_id = $1
       ORDER BY oi.created_at ASC`,
      [id]
    );

    return formatOrder(orderRes.rows[0], itemsRes.rows);
  }

  /**
   * POST /api/bar/orders - Create order or open tab
   */
  async createOrder(payload = {}) {
    const id = payload.id || null;
    const tableId = payload.tableId || payload.table_id;
    const memberId = payload.memberId || payload.member_id || null;
    const guestName = payload.guestName || payload.guest_name || null;
    const membershipTier = payload.membershipTier || payload.membership_tier || null;
    const discountPercentage = payload.discountPercentage !== undefined ? payload.discountPercentage : payload.discount_percentage;
    const items = payload.items || [];
    const kitchenStatus = payload.kitchenStatus || payload.kitchen_status || 'PENDING';

    return withTransaction(async (client) => {
      // 1. Verify Table Existence
      const tableRes = await client.query('SELECT * FROM bar_tables WHERE id = $1', [tableId]);
      if (tableRes.rowCount === 0) {
        const error = new Error(`Table '${tableId}' does not exist`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Concurrency check: Ensure table does not already have an open tab
      const openOrderRes = await client.query(
        'SELECT id FROM bar_orders WHERE table_id = $1 AND status = $2 FOR UPDATE',
        [tableId, 'open']
      );

      if (openOrderRes.rowCount > 0 && (!id || openOrderRes.rows[0].id !== id)) {
        const existingId = openOrderRes.rows[0].id;
        const error = new Error(`Table '${tableId}' is already in active use with open tab #${existingId}.`);
        error.statusCode = 409;
        error.code = 'TABLE_ALREADY_ACTIVE';
        throw error;
      }

      // 3. Resolve Member & Membership Tier Discount
      let resolvedMemberId = null;
      let resolvedGuestName = guestName || 'Walk-in Guest';
      let resolvedTier = membershipTier || 'Guest';
      let resolvedDiscountPct = 0;

      if (memberId) {
        const memberRes = await client.query(
          `SELECT m.id, m.first_name, m.last_name, m.email,
                  ms.status AS membership_status, ms.end_date,
                  mp.tier, mp.bar_discount_pct
           FROM members m
           LEFT JOIN memberships ms ON ms.member_id = m.id AND ms.status = 'active' AND (ms.end_date IS NULL OR ms.end_date >= CURRENT_DATE)
           LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
           WHERE m.id = $1 OR m.member_number = $1
           ORDER BY ms.created_at DESC
           LIMIT 1`,
          [memberId]
        );

        if (memberRes.rowCount === 0) {
          const error = new Error(`Member '${memberId}' not found`);
          error.statusCode = 404;
          throw error;
        }

        const memberInfo = memberRes.rows[0];
        resolvedMemberId = memberInfo.id;
        resolvedGuestName = `${memberInfo.first_name} ${memberInfo.last_name}`;

        if (memberInfo.membership_status === 'active') {
          resolvedTier = memberInfo.tier || 'Member';
          if (memberInfo.bar_discount_pct !== null && memberInfo.bar_discount_pct !== undefined) {
            resolvedDiscountPct = parseFloat(memberInfo.bar_discount_pct);
          } else if (resolvedTier === 'Gold') {
            resolvedDiscountPct = 15.0;
          } else if (resolvedTier === 'Silver') {
            resolvedDiscountPct = 10.0;
          } else if (resolvedTier === 'Junior') {
            resolvedDiscountPct = 10.0;
          }
        } else {
          // Inactive or expired membership -> Standard pricing (0% discount)
          resolvedTier = 'Guest';
          resolvedDiscountPct = 0;
        }
      }

      if (typeof discountPercentage === 'number' && !isNaN(discountPercentage)) {
        resolvedDiscountPct = discountPercentage;
      }

      // 4. Resolve Menu Items & Pricing
      const resolvedItems = [];
      if (Array.isArray(items) && items.length > 0) {
        const itemIds = items.map(i => i.itemId || i.id);
        const menuRes = await client.query(
          'SELECT id, name, category, price, member_price, in_stock FROM menu_items WHERE id = ANY($1)',
          [itemIds]
        );

        const menuMap = new Map(menuRes.rows.map(m => [m.id, m]));

        for (const item of items) {
          const itemId = item.itemId || item.id;
          const menuItem = menuMap.get(itemId);
          if (!menuItem) {
            const error = new Error(`Menu item '${itemId}' does not exist`);
            error.statusCode = 422;
            throw error;
          }

          const qty = parseInt(item.quantity || 1, 10);
          if (qty <= 0) {
            const error = new Error(`Quantity must be a positive integer for item ${menuItem.name}`);
            error.statusCode = 422;
            throw error;
          }

          const unitPrice = parseFloat(item.unitPrice !== undefined ? item.unitPrice : menuItem.price);
          resolvedItems.push({
            itemId: menuItem.id,
            name: menuItem.name,
            category: menuItem.category,
            quantity: qty,
            unitPrice,
            notes: item.notes || '',
            kitchenStatus: item.kitchenStatus || kitchenStatus.toUpperCase() || 'PENDING'
          });
        }
      }

      // 5. Calculate Financials
      const financials = calculateOrderFinancials(resolvedItems, resolvedDiscountPct);
      const orderId = id || `ORD-${Date.now().toString().slice(-4)}`;

      // 6. Insert Bar Order
      await client.query(
        `INSERT INTO bar_orders (
          id, table_id, member_id, guest_name, membership_tier, status,
          kitchen_status, discount_percentage, subtotal, discount_amount,
          tax, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          orderId,
          tableId,
          resolvedMemberId,
          resolvedGuestName,
          resolvedTier,
          'open',
          kitchenStatus.toUpperCase() || 'PENDING',
          financials.discountPercentage,
          financials.subtotal,
          financials.discountAmount,
          financials.tax,
          financials.total
        ]
      );

      // 7. Insert Order Items
      const createdItems = [];
      for (const item of resolvedItems) {
        const itemRes = await client.query(
          `INSERT INTO bar_order_items (
            bar_order_id, item_id, quantity, unit_price, notes, kitchen_status
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [orderId, item.itemId, item.quantity, item.unitPrice, item.notes, item.kitchenStatus]
        );
        createdItems.push({
          ...itemRes.rows[0],
          item_name: item.name,
          category: item.category
        });
      }

      // 8. Update Table status to 'occupied'
      await client.query(
        `UPDATE bar_tables
         SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [tableId]
      );

      const orderRow = {
        id: orderId,
        table_id: tableId,
        table_name: tableRes.rows[0].name,
        member_id: resolvedMemberId,
        guest_name: resolvedGuestName,
        membership_tier: resolvedTier,
        status: 'open',
        kitchen_status: kitchenStatus.toUpperCase() || 'PENDING',
        discount_percentage: financials.discountPercentage,
        discount_amount: financials.discountAmount,
        subtotal: financials.subtotal,
        tax: financials.tax,
        total: financials.total,
        payment_method: null,
        settled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return formatOrder(orderRow, createdItems);
    });
  }

  /**
   * POST /api/bar/orders/:id/items - Add items to existing open tab
   */
  async addItemsToOrder(orderId, items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Items array is required');
      error.statusCode = 422;
      throw error;
    }

    return withTransaction(async (client) => {
      // 1. Lock and fetch order
      const orderRes = await client.query(
        'SELECT * FROM bar_orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        const error = new Error(`Bar order '${orderId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const order = orderRes.rows[0];
      if (order.status === 'settled') {
        const error = new Error('Cannot add items to an already-settled bar order tab');
        error.statusCode = 422;
        throw error;
      }

      // 2. Fetch menu items for new items
      const itemIds = items.map(i => i.itemId || i.id);
      const menuRes = await client.query(
        'SELECT id, name, category, price, member_price, in_stock FROM menu_items WHERE id = ANY($1)',
        [itemIds]
      );

      const menuMap = new Map(menuRes.rows.map(m => [m.id, m]));

      for (const item of items) {
        const itemId = item.itemId || item.id;
        const menuItem = menuMap.get(itemId);
        if (!menuItem) {
          const error = new Error(`Menu item '${itemId}' does not exist`);
          error.statusCode = 422;
          throw error;
        }

        const qty = parseInt(item.quantity || 1, 10);
        if (qty <= 0) {
          const error = new Error(`Quantity must be a positive integer for item ${menuItem.name}`);
          error.statusCode = 422;
          throw error;
        }

        const unitPrice = parseFloat(item.unitPrice !== undefined ? item.unitPrice : menuItem.price);
        await client.query(
          `INSERT INTO bar_order_items (
            bar_order_id, item_id, quantity, unit_price, notes, kitchen_status
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, menuItem.id, qty, unitPrice, item.notes || '', item.kitchenStatus || 'PENDING']
        );
      }

      // 3. Fetch all items for this order to recalculate totals
      const allItemsRes = await client.query(
        `SELECT oi.*, mi.name AS item_name, mi.category
         FROM bar_order_items oi
         JOIN menu_items mi ON mi.id = oi.item_id
         WHERE oi.bar_order_id = $1
         ORDER BY oi.created_at ASC`,
        [orderId]
      );

      const financials = calculateOrderFinancials(allItemsRes.rows, order.discount_percentage);

      // 4. Update order with new financials
      const updatedOrderRes = await client.query(
        `UPDATE bar_orders
         SET subtotal = $1, discount_amount = $2, tax = $3, total = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [financials.subtotal, financials.discountAmount, financials.tax, financials.total, orderId]
      );

      return formatOrder(updatedOrderRes.rows[0], allItemsRes.rows);
    });
  }

  /**
   * PATCH /api/bar/orders/:id/items/:itemId - Update item quantity or notes
   */
  async updateOrderItem(orderId, itemId, updates = {}) {
    return withTransaction(async (client) => {
      // 1. Lock and fetch order
      const orderRes = await client.query(
        'SELECT * FROM bar_orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        const error = new Error(`Bar order '${orderId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const order = orderRes.rows[0];
      if (order.status === 'settled') {
        const error = new Error('Cannot modify an already-settled order');
        error.statusCode = 422;
        throw error;
      }

      // 2. Find target item
      const itemRes = await client.query(
        `SELECT * FROM bar_order_items
         WHERE bar_order_id = $1 AND (item_id = $2 OR id::text = $2)
         LIMIT 1`,
        [orderId, itemId]
      );

      if (itemRes.rowCount === 0) {
        const error = new Error(`Item '${itemId}' not found in order`);
        error.statusCode = 404;
        throw error;
      }

      const currentItem = itemRes.rows[0];
      const newQty = updates.quantity !== undefined ? parseInt(updates.quantity, 10) : currentItem.quantity;
      if (newQty <= 0) {
        const error = new Error('Item quantity must be a positive integer');
        error.statusCode = 422;
        throw error;
      }

      const newNotes = updates.notes !== undefined ? updates.notes : currentItem.notes;
      const newKitchenStatus = updates.kitchenStatus ? updates.kitchenStatus.toUpperCase() : currentItem.kitchen_status;

      await client.query(
        `UPDATE bar_order_items
         SET quantity = $1, notes = $2, kitchen_status = $3
         WHERE id = $4`,
        [newQty, newNotes, newKitchenStatus, currentItem.id]
      );

      // 3. Recalculate totals
      const allItemsRes = await client.query(
        `SELECT oi.*, mi.name AS item_name, mi.category
         FROM bar_order_items oi
         JOIN menu_items mi ON mi.id = oi.item_id
         WHERE oi.bar_order_id = $1
         ORDER BY oi.created_at ASC`,
        [orderId]
      );

      const financials = calculateOrderFinancials(allItemsRes.rows, order.discount_percentage);

      const updatedOrderRes = await client.query(
        `UPDATE bar_orders
         SET subtotal = $1, discount_amount = $2, tax = $3, total = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [financials.subtotal, financials.discountAmount, financials.tax, financials.total, orderId]
      );

      return formatOrder(updatedOrderRes.rows[0], allItemsRes.rows);
    });
  }

  /**
   * PATCH /api/bar/orders/:id/status - Update kitchen progression status
   */
  async updateKitchenStatus(orderId, status) {
    const normalized = (status || 'PENDING').toUpperCase();

    return withTransaction(async (client) => {
      const orderRes = await client.query(
        'SELECT * FROM bar_orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        const error = new Error(`Bar order '${orderId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const order = orderRes.rows[0];
      if (order.status === 'settled') {
        const error = new Error('Cannot change kitchen status on an already settled order');
        error.statusCode = 422;
        throw error;
      }

      await client.query(
        `UPDATE bar_orders
         SET kitchen_status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [normalized, orderId]
      );

      await client.query(
        `UPDATE bar_order_items
         SET kitchen_status = $1
         WHERE bar_order_id = $2`,
        [normalized, orderId]
      );

      const allItemsRes = await client.query(
        `SELECT oi.*, mi.name AS item_name, mi.category
         FROM bar_order_items oi
         JOIN menu_items mi ON mi.id = oi.item_id
         WHERE oi.bar_order_id = $1
         ORDER BY oi.created_at ASC`,
        [orderId]
      );

      const updatedOrderRes = await client.query('SELECT * FROM bar_orders WHERE id = $1', [orderId]);
      return formatOrder(updatedOrderRes.rows[0], allItemsRes.rows);
    });
  }

  /**
   * POST /api/bar/orders/:id/settle - Settle bill tab and record payment transactionally
   */
  async settleOrder(orderId, { paymentMethod, amount = null, transactionReference = null, notes = null }) {
    if (!paymentMethod) {
      const error = new Error('Payment method is required to settle order');
      error.statusCode = 422;
      throw error;
    }

    return withTransaction(async (client) => {
      // 1. Lock and fetch order
      const orderRes = await client.query(
        'SELECT * FROM bar_orders WHERE id = $1 FOR UPDATE',
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        const error = new Error(`Bar order '${orderId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const order = orderRes.rows[0];
      if (order.status === 'settled') {
        const error = new Error('Order is already settled. Duplicate settlement not allowed.');
        error.statusCode = 409;
        throw error;
      }

      const orderTotal = parseFloat(order.total);
      const settleAmount = amount !== null && amount !== undefined ? parseFloat(amount) : orderTotal;

      if (settleAmount < orderTotal) {
        const error = new Error(`Payment amount (${settleAmount}) is less than expected order total (${orderTotal})`);
        error.statusCode = 422;
        throw error;
      }

      const settledAt = new Date().toISOString();
      const normalizedMethod = paymentMethod.toLowerCase().trim();

      // 2. Mark order as settled
      const updatedOrderRes = await client.query(
        `UPDATE bar_orders
         SET status = 'settled',
             kitchen_status = 'SERVED',
             payment_method = $1,
             settled_at = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [normalizedMethod, settledAt, orderId]
      );

      // 3. Record Payment in Payments table
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
      const paymentNumber = `PAY-BAR-${Date.now().toString().slice(-6)}`;
      const dbPaymentMethod = ['cash', 'card', 'upi'].includes(normalizedMethod) ? normalizedMethod : 'cash';

      await client.query(
        `INSERT INTO payments (
          payment_number, member_id, amount, payment_method,
          transaction_reference, status, paid_at, notes
        ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7)`,
        [
          paymentNumber,
          order.member_id,
          settleAmount,
          dbPaymentMethod,
          transactionReference || receiptNumber,
          settledAt,
          notes || `Bar Tab #${orderId} settlement`
        ]
      );

      // 4. Free Table if no other open tabs exist on this table
      if (order.table_id) {
        const otherTabsRes = await client.query(
          `SELECT id FROM bar_orders
           WHERE table_id = $1 AND status = 'open' AND id != $2`,
          [order.table_id, orderId]
        );

        if (otherTabsRes.rowCount === 0) {
          await client.query(
            `UPDATE bar_tables
             SET status = 'available', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [order.table_id]
          );
        }
      }

      const allItemsRes = await client.query(
        `SELECT oi.*, mi.name AS item_name, mi.category
         FROM bar_order_items oi
         JOIN menu_items mi ON mi.id = oi.item_id
         WHERE oi.bar_order_id = $1
         ORDER BY oi.created_at ASC`,
        [orderId]
      );

      const formattedOrder = formatOrder(updatedOrderRes.rows[0], allItemsRes.rows);

      return {
        success: true,
        order: formattedOrder,
        paymentMethod: normalizedMethod,
        receiptNumber,
        settledAt,
        message: 'Tab settled successfully'
      };
    });
  }
}

module.exports = new BarService();
