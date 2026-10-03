/**
 * Champions Club - Shop & Inventory Validation Helpers
 * Role: MEMBER 4 (Backend Operations)
 */

const { validators } = require('../../middleware/validator');

function validateCreateProduct(body = {}) {
  const errors = [];
  if (!validators.isNonEmptyString(body.name, 2, 200)) errors.push({ field: 'name', message: 'Product name required (2-200 chars)' });
  if (!validators.isNonEmptyString(body.categoryId)) errors.push({ field: 'categoryId', message: 'Category ID is required' });
  if (!validators.isNonNegativeNumber(body.price)) errors.push({ field: 'price', message: 'Price must be a non-negative number' });
  if (body.memberPrice !== undefined && !validators.isNonNegativeNumber(body.memberPrice)) errors.push({ field: 'memberPrice', message: 'Member price must be non-negative' });
  if (body.initialStock !== undefined && (!Number.isInteger(Number(body.initialStock)) || Number(body.initialStock) < 0)) errors.push({ field: 'initialStock', message: 'Initial stock must be a non-negative integer' });
  if (body.reorderThreshold !== undefined && (!Number.isInteger(Number(body.reorderThreshold)) || Number(body.reorderThreshold) < 0)) errors.push({ field: 'reorderThreshold', message: 'Reorder threshold must be a non-negative integer' });

  return { isValid: errors.length === 0, errors };
}

function validateUpdateProduct(body = {}) {
  const errors = [];
  if (body.name !== undefined && !validators.isNonEmptyString(body.name, 2, 200)) errors.push({ field: 'name', message: 'Name must be 2-200 characters' });
  if (body.price !== undefined && !validators.isNonNegativeNumber(body.price)) errors.push({ field: 'price', message: 'Price must be non-negative' });
  if (body.memberPrice !== undefined && !validators.isNonNegativeNumber(body.memberPrice)) errors.push({ field: 'memberPrice', message: 'Member price must be non-negative' });
  if (body.stock !== undefined && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) errors.push({ field: 'stock', message: 'Stock must be a non-negative integer' });

  return { isValid: errors.length === 0, errors };
}

function validateCreateShopOrder(body = {}) {
  const errors = [];

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'Order must contain at least one item' });
  } else {
    body.items.forEach((item, i) => {
      if (!item || !validators.isNonEmptyString(item.productId)) errors.push({ field: `items[${i}].productId`, message: 'Product ID required' });
      const qty = Number(item?.quantity);
      if (!Number.isInteger(qty) || qty <= 0) errors.push({ field: `items[${i}].quantity`, message: 'Quantity must be > 0' });
    });
  }

  const validTypes = ['counter', 'online_pickup', 'online_delivery'];
  if (body.orderType && !validTypes.includes(body.orderType)) errors.push({ field: 'orderType', message: `Invalid orderType. Valid: ${validTypes.join(', ')}` });

  const validFulfilment = ['in_store', 'pickup', 'delivery'];
  if (body.fulfilmentType && !validFulfilment.includes(body.fulfilmentType)) errors.push({ field: 'fulfilmentType', message: `Invalid fulfilmentType. Valid: ${validFulfilment.join(', ')}` });

  if ((body.orderType === 'online_delivery' || body.fulfilmentType === 'delivery') && !validators.isNonEmptyString(body.deliveryAddress, 5)) {
    errors.push({ field: 'deliveryAddress', message: 'Delivery address is required for delivery orders' });
  }

  if (body.customerEmail && !validators.isEmail(body.customerEmail)) errors.push({ field: 'customerEmail', message: 'Valid email format is required' });

  return { isValid: errors.length === 0, errors };
}

function validateUpdateOrderStatus(body = {}) {
  const errors = [];
  const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
  if (!validators.isIn(body.status, validStatuses)) errors.push({ field: 'status', message: `Status must be: ${validStatuses.join(', ')}` });

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateShopOrder,
  validateUpdateOrderStatus
};
