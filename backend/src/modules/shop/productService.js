/**
 * Champions Club - Products Catalogue Service
 * Role: MEMBER 4 (Backend Operations)
 */

const { query, withTransaction } = require('../../config/database');

function formatProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    category: row.category,
    sportId: row.sport_id,
    sport: row.sport || 'Multi-Sport',
    sku: row.sku,
    price: parseFloat(row.price),
    memberPrice: parseFloat(row.member_price),
    rating: parseFloat(row.rating || 5.0),
    badge: row.badge,
    description: row.description,
    image: row.image_url,
    imageUrl: row.image_url,
    stock: parseInt(row.stock || 0, 10),
    quantityReserved: parseInt(row.quantity_reserved || 0, 10),
    reorderThreshold: parseInt(row.reorder_threshold || 5, 10),
    reorderQuantity: parseInt(row.reorder_quantity || 20, 10),
    inStock: Boolean(row.in_stock),
    isLowStock: Boolean(row.is_low_stock),
    isActive: row.is_active
  };
}

class ProductService {
  /**
   * List products with joined category, sport, and inventory stock
   */
  async getProducts({ category = '', search = '', sport = '', inStock, lowStock, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT p.id, p.category_id, pc.name AS category, p.sport_id, s.name AS sport,
             p.name, p.sku, p.price, p.member_price, p.rating, p.badge,
             p.description, p.image_url, p.is_active, p.created_at, p.updated_at,
             COALESCE(inv.quantity_on_hand, 0) AS stock,
             COALESCE(inv.quantity_reserved, 0) AS quantity_reserved,
             COALESCE(inv.reorder_threshold, 5) AS reorder_threshold,
             (COALESCE(inv.quantity_on_hand, 0) > 0) AS in_stock,
             (COALESCE(inv.quantity_on_hand, 0) <= COALESCE(inv.reorder_threshold, 5) AND COALESCE(inv.quantity_on_hand, 0) > 0) AS is_low_stock
      FROM products p
      JOIN product_categories pc ON pc.id = p.category_id
      LEFT JOIN sports s ON s.id = p.sport_id
      LEFT JOIN inventory inv ON inv.product_id = p.id
      WHERE p.is_active = true
    `;
    const params = [];

    if (category && category !== 'All') {
      params.push(`%${category.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(pc.name) LIKE $${params.length} OR LOWER(pc.id) LIKE $${params.length})`;
    }

    if (sport && sport !== 'All') {
      params.push(`%${sport.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(s.name) LIKE $${params.length} OR LOWER(s.id) LIKE $${params.length})`;
    }

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.description) LIKE $${params.length} OR LOWER(p.sku) LIKE $${params.length})`;
    }

    if (inStock === 'true' || inStock === true) {
      sql += ` AND COALESCE(inv.quantity_on_hand, 0) > 0`;
    } else if (inStock === 'false' || inStock === false) {
      sql += ` AND COALESCE(inv.quantity_on_hand, 0) = 0`;
    }

    if (lowStock === 'true' || lowStock === true) {
      sql += ` AND COALESCE(inv.quantity_on_hand, 0) <= COALESCE(inv.reorder_threshold, 5)`;
    }

    sql += ` ORDER BY p.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows.map(formatProduct);
  }

  /**
   * Get single product by ID
   */
  async getProductById(productId) {
    const res = await query(
      `SELECT p.id, p.category_id, pc.name AS category, p.sport_id, s.name AS sport,
              p.name, p.sku, p.price, p.member_price, p.rating, p.badge,
              p.description, p.image_url, p.is_active, p.created_at, p.updated_at,
              COALESCE(inv.quantity_on_hand, 0) AS stock,
              COALESCE(inv.quantity_reserved, 0) AS quantity_reserved,
              COALESCE(inv.reorder_threshold, 5) AS reorder_threshold,
              COALESCE(inv.reorder_quantity, 20) AS reorder_quantity,
              (COALESCE(inv.quantity_on_hand, 0) > 0) AS in_stock
       FROM products p
       JOIN product_categories pc ON pc.id = p.category_id
       LEFT JOIN sports s ON s.id = p.sport_id
       LEFT JOIN inventory inv ON inv.product_id = p.id
       WHERE p.id = $1`,
      [productId]
    );

    if (res.rowCount === 0) {
      const error = new Error(`Product '${productId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return formatProduct(res.rows[0]);
  }

  /**
   * Create a new product and initialize inventory in a transaction
   */
  async createProduct({
    id,
    categoryId,
    category = null,
    sportId = null,
    name,
    sku = null,
    price,
    memberPrice = null,
    rating = 5.0,
    badge = null,
    description = null,
    imageUrl = null,
    initialStock = 0,
    stockQuantity = 0,
    reorderThreshold = 5,
    lowStockThreshold = 5,
    reorderQuantity = 20,
    userId = null
  }) {
    return withTransaction(async (client) => {
      let effectiveCatId = categoryId;
      if (!effectiveCatId && category) {
        const catLookup = await client.query('SELECT id FROM product_categories WHERE LOWER(name) = LOWER($1) OR id = $1', [category.trim()]);
        if (catLookup.rowCount > 0) effectiveCatId = catLookup.rows[0].id;
      }
      if (!effectiveCatId) effectiveCatId = 'cat-rackets';

      const catCheck = await client.query('SELECT id FROM product_categories WHERE id = $1', [effectiveCatId]);
      if (catCheck.rowCount === 0) {
        const error = new Error(`Product category '${effectiveCatId}' not found`);
        error.statusCode = 400;
        throw error;
      }

      const productId = id || `prod-${Date.now().toString().slice(-6)}`;
      const effectiveMemberPrice = memberPrice !== null && memberPrice !== undefined ? memberPrice : (price * 0.8);
      const generatedSku = sku || `SKU-${productId.toUpperCase()}`;

      const productRes = await client.query(
        `INSERT INTO products (
            id, category_id, sport_id, name, sku, price, member_price,
            rating, badge, description, image_url, is_active
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
         RETURNING *`,
        [productId, effectiveCatId, sportId, name.trim(), generatedSku, price, effectiveMemberPrice, rating, badge, description, imageUrl]
      );

      const effectiveThreshold = reorderThreshold !== undefined ? reorderThreshold : (lowStockThreshold || 5);
      const stockQty = Math.max(0, parseInt(stockQuantity || initialStock || 0, 10));
      await client.query(
        `INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, reorder_threshold, reorder_quantity)
         VALUES ($1, $2, 0, $3, $4)
         ON CONFLICT (product_id) DO UPDATE SET
            quantity_on_hand = EXCLUDED.quantity_on_hand,
            reorder_threshold = EXCLUDED.reorder_threshold`,
        [productId, stockQty, reorderThreshold, reorderQuantity]
      );

      if (stockQty > 0) {
        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
           VALUES ($1, 'purchase_receipt', $2, 'INITIAL_SETUP', 'Initial catalog stock intake', $3)`,
          [productId, stockQty, userId]
        );
      }

      return {
        ...productRes.rows[0],
        stock: stockQty,
        inStock: stockQty > 0
      };
    });
  }

  /**
   * Update product attributes and optionally adjust inventory
   */
  async updateProduct(productId, updates = {}, userId = null) {
    return withTransaction(async (client) => {
      const existingRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
      if (existingRes.rowCount === 0) {
        const error = new Error(`Product '${productId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      const allowedFields = ['category_id', 'sport_id', 'name', 'sku', 'price', 'member_price', 'rating', 'badge', 'description', 'image_url', 'is_active'];
      const setClauses = [];
      const params = [productId];

      for (const [key, value] of Object.entries(updates)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (allowedFields.includes(snakeKey)) {
          params.push(value);
          setClauses.push(`${snakeKey} = $${params.length}`);
        }
      }

      if (setClauses.length > 0) {
        await client.query(
          `UPDATE products SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          params
        );
      }

      if (updates.stock !== undefined || updates.quantityOnHand !== undefined) {
        const targetStock = parseInt(updates.stock !== undefined ? updates.stock : updates.quantityOnHand, 10);
        const invRes = await client.query('SELECT quantity_on_hand FROM inventory WHERE product_id = $1 FOR UPDATE', [productId]);
        const currentStock = invRes.rowCount > 0 ? invRes.rows[0].quantity_on_hand : 0;
        const diff = targetStock - currentStock;

        await client.query(
          `INSERT INTO inventory (product_id, quantity_on_hand)
           VALUES ($1, $2)
           ON CONFLICT (product_id) DO UPDATE SET quantity_on_hand = $2, updated_at = CURRENT_TIMESTAMP`,
          [productId, targetStock]
        );

        if (diff !== 0) {
          await client.query(
            `INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id, notes, created_by)
             VALUES ($1, 'adjustment', $2, 'MANUAL_OVERRIDE', $3, $4)`,
            [productId, diff, updates.adjustmentNotes || 'Manual stock update', userId]
          );
        }
      }

      return this.getProductById(productId);
    });
  }

  /**
   * Delete or archive product based on historical reference check
   */
  async deleteProduct(productId) {
    return withTransaction(async (client) => {
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
      if (prodRes.rowCount === 0) {
        const error = new Error(`Product '${productId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      // Check if product has historical orders or invoice items
      const orderCheck = await client.query('SELECT 1 FROM shop_order_items WHERE product_id = $1 LIMIT 1', [productId]);
      const invoiceCheck = await client.query("SELECT 1 FROM invoice_items WHERE reference_type = 'product' AND reference_id = $1 LIMIT 1", [productId]);

      const hasHistory = orderCheck.rowCount > 0 || invoiceCheck.rowCount > 0;

      if (hasHistory) {
        // Soft delete / archive to protect transactional and financial records
        await client.query(
          'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [productId]
        );
        return {
          id: productId,
          archived: true,
          deleted: false,
          message: 'Product archived and deactivated successfully (preserved historical transaction records)'
        };
      } else {
        // Safe to remove cleanly
        await client.query('DELETE FROM inventory WHERE product_id = $1', [productId]);
        await client.query('DELETE FROM stock_movements WHERE product_id = $1', [productId]);
        await client.query('DELETE FROM products WHERE id = $1', [productId]);
        return {
          id: productId,
          archived: false,
          deleted: true,
          message: 'Product permanently removed successfully'
        };
      }
    });
  }
}

module.exports = new ProductService();
