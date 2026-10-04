/**
 * Champions Club - Inventory & Shelf Management Service
 * Role: MEMBER 4 (Backend Operations)
 */

const { query, withTransaction } = require('../../config/database');

function formatInventory(row) {
  if (!row) return null;
  const qty = parseInt(row.quantity_on_hand || 0, 10);
  const threshold = parseInt(row.reorder_threshold || 5, 10);
  const reorderQty = parseInt(row.reorder_quantity || 20, 10);
  const isLowStock = qty <= threshold;

  return {
    inventoryId: row.inventory_id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    category: row.category_name || row.category,
    price: parseFloat(row.price),
    memberPrice: parseFloat(row.member_price),
    imageUrl: row.image_url,
    quantityOnHand: qty,
    quantityReserved: parseInt(row.quantity_reserved || 0, 10),
    reorderThreshold: threshold,
    reorderQuantity: reorderQty,
    stockStatus: row.stock_status || (qty <= 0 ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'IN_STOCK'),
    isLowStock,
    suggestedReorderUnits: Math.max(0, reorderQty - qty),
    updatedAt: row.updated_at
  };
}

class InventoryService {
  /**
   * Get full inventory status with linked product details
   */
  async getInventory({ category = '', lowStockOnly = false, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT inv.id AS inventory_id, inv.product_id,
             p.name AS product_name, p.sku, p.price, p.member_price, p.image_url,
             pc.id AS category_id, pc.name AS category_name,
             inv.quantity_on_hand, inv.quantity_reserved,
             inv.reorder_threshold, inv.reorder_quantity,
             inv.updated_at,
             CASE
               WHEN inv.quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
               WHEN inv.quantity_on_hand <= inv.reorder_threshold THEN 'LOW_STOCK'
               ELSE 'IN_STOCK'
             END AS stock_status
      FROM inventory inv
      JOIN products p ON p.id = inv.product_id
      JOIN product_categories pc ON pc.id = p.category_id
      WHERE p.is_active = true
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(`%${category.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(pc.name) LIKE $${params.length} OR LOWER(pc.id) LIKE $${params.length})`;
    }

    if (lowStockOnly === 'true' || lowStockOnly === true) {
      sql += ` AND inv.quantity_on_hand <= inv.reorder_threshold`;
    }

    sql += ` ORDER BY inv.quantity_on_hand ASC, p.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 100, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows.map(formatInventory);
  }

  /**
   * Get all items requiring restocking (quantity_on_hand <= reorder_threshold)
   */
  async getLowStockItems() {
    const res = await query(
      `SELECT inv.id AS inventory_id, inv.product_id,
              p.name AS product_name, p.sku, p.price, p.member_price, p.image_url,
              pc.name AS category,
              inv.quantity_on_hand, inv.quantity_reserved,
              inv.reorder_threshold, inv.reorder_quantity,
              inv.updated_at,
              CASE
                WHEN inv.quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
                ELSE 'LOW_STOCK'
              END AS stock_status
       FROM inventory inv
       JOIN products p ON p.id = inv.product_id
       JOIN product_categories pc ON pc.id = p.category_id
       WHERE p.is_active = true 
         AND inv.quantity_on_hand <= inv.reorder_threshold
       ORDER BY inv.quantity_on_hand ASC`
    );

    return res.rows.map(formatInventory);
  }

  /**
   * Record stock movement and adjust inventory in a single atomic transaction
   */
  async recordStockMovement({ productId, quantity, movementType, referenceId = null, notes = null, userId = null }, client = null) {
    const execute = async (dbClient) => {
      const invRes = await dbClient.query('SELECT quantity_on_hand FROM inventory WHERE product_id = $1 FOR UPDATE', [productId]);
      if (invRes.rowCount === 0) {
        const error = new Error(`Inventory record for product '${productId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const currentQty = invRes.rows[0].quantity_on_hand;
      const nextQty = currentQty + quantity;

      if (nextQty < 0) {
        const error = new Error(`Insufficient stock for product '${productId}'. Requested: ${Math.abs(quantity)}, Available: ${currentQty}`);
        error.statusCode = 409;
        throw error;
      }

      await dbClient.query('UPDATE inventory SET quantity_on_hand = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2', [nextQty, productId]);

      let normalizedType = movementType;
      if (normalizedType === 'restock' || normalizedType === 'intake') normalizedType = 'purchase_receipt';
      if (normalizedType === 'damage' || normalizedType === 'write_off') normalizedType = 'damaged';
      if (normalizedType === 'audit_adjustment') normalizedType = 'adjustment';

      const movementRes = await dbClient.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [productId, normalizedType, quantity, referenceId, notes, userId]
      );

      return {
        movement: movementRes.rows[0],
        productId,
        previousStock: currentQty,
        newStock: nextQty
      };
    };

    return client ? execute(client) : withTransaction(execute);
  }

  /**
   * Get stock movement history for audit log
   */
  async getStockMovements({ productId = null, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT sm.id, sm.product_id, p.name AS product_name, p.sku,
             sm.movement_type, sm.quantity, sm.reference_id, sm.notes,
             sm.created_at, sm.created_by,
             u.first_name || ' ' || u.last_name AS user_name
      FROM stock_movements sm
      JOIN products p ON p.id = sm.product_id
      LEFT JOIN users u ON u.id = sm.created_by
      WHERE 1=1
    `;
    const params = [];

    if (productId) {
      params.push(productId);
      sql += ` AND sm.product_id = $${params.length}`;
    }

    sql += ` ORDER BY sm.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows;
  }
}

module.exports = new InventoryService();
