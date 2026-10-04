/**
 * Champions Club - Bar Operations Validators
 * Role: MEMBER 4 (Backend Operations - Bar POS & Settlement)
 */

const VALID_KITCHEN_STATUSES = ['PENDING', 'PREPARING', 'READY', 'SERVED'];
const VALID_ORDER_STATUSES = ['open', 'settled', 'voided', 'cancelled'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'member_tab', 'split'];

/**
 * Validates order creation payload
 */
function validateCreateOrder(body = {}) {
  const errors = {};

  if (!body.tableId || typeof body.tableId !== 'string' || !body.tableId.trim()) {
    errors.tableId = 'Table ID is required to open a bar tab';
  }

  if (body.items !== undefined) {
    if (!Array.isArray(body.items)) {
      errors.items = 'Items must be an array';
    } else {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        const itemId = item.itemId || item.id;
        if (!itemId || typeof itemId !== 'string') {
          errors[`items[${i}].itemId`] = 'Item ID is required';
        }
        const qty = Number(item.quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
          errors[`items[${i}].quantity`] = 'Quantity must be a positive integer';
        }
      }
    }
  }

  if (body.kitchenStatus && !VALID_KITCHEN_STATUSES.includes(body.kitchenStatus.toUpperCase())) {
    errors.kitchenStatus = `Invalid kitchen status. Allowed: ${VALID_KITCHEN_STATUSES.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates adding items to an existing order
 */
function validateAddItems(body = {}) {
  const errors = {};

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'Items array must contain at least one item';
    return { isValid: false, errors };
  }

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    const itemId = item.itemId || item.id;
    if (!itemId || typeof itemId !== 'string') {
      errors[`items[${i}].itemId`] = 'Item ID is required';
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      errors[`items[${i}].quantity`] = 'Quantity must be a positive integer';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates updating an item quantity or notes
 */
function validateUpdateItem(body = {}) {
  const errors = {};

  if (body.quantity !== undefined) {
    const qty = Number(body.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      errors.quantity = 'Item quantity must be a positive integer';
    }
  }

  if (body.kitchenStatus && !VALID_KITCHEN_STATUSES.includes(body.kitchenStatus.toUpperCase())) {
    errors.kitchenStatus = `Invalid kitchen status. Allowed: ${VALID_KITCHEN_STATUSES.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates updating order kitchen/order status
 */
function validateUpdateStatus(body = {}) {
  const errors = {};

  if (!body.status && !body.kitchenStatus) {
    errors.status = 'Status or kitchenStatus is required';
  } else {
    const statusVal = (body.kitchenStatus || body.status).toUpperCase();
    const isKitchen = VALID_KITCHEN_STATUSES.includes(statusVal);
    const isOrder = VALID_ORDER_STATUSES.includes(statusVal.toLowerCase());
    if (!isKitchen && !isOrder) {
      errors.status = `Invalid status. Allowed kitchen statuses: ${VALID_KITCHEN_STATUSES.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates settlement payload
 */
function validateSettlement(body = {}) {
  const errors = {};

  if (!body.paymentMethod || typeof body.paymentMethod !== 'string') {
    errors.paymentMethod = 'Payment method is required (cash, card, upi)';
  } else {
    const method = body.paymentMethod.toLowerCase().trim();
    if (!VALID_PAYMENT_METHODS.includes(method)) {
      errors.paymentMethod = `Invalid payment method '${method}'. Allowed: cash, card, upi, member_tab, split`;
    }
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Payment amount must be a positive number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  VALID_KITCHEN_STATUSES,
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_METHODS,
  validateCreateOrder,
  validateAddItems,
  validateUpdateItem,
  validateUpdateStatus,
  validateSettlement
};
