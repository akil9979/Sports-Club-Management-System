/**
 * Champions Club - Finance & Reporting Validators
 * Role: MEMBER 4 (Backend Operations - Finance, Payments, Invoices & Reports)
 */

const VALID_INVOICE_TYPES = ['membership', 'booking', 'shop', 'bar', 'quotation', 'general'];
const VALID_INVOICE_STATUSES = ['draft', 'unpaid', 'partially_paid', 'paid', 'void', 'overdue'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque'];
const VALID_EXPENSE_CATEGORIES = ['maintenance', 'inventory_purchase', 'utilities', 'salaries', 'marketing', 'equipment', 'software', 'misc'];
const VALID_EXPENSE_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'upi', 'cheque'];
const VALID_PERIODS = ['today', 'week', 'month'];

/**
 * Validates invoice creation
 */
function validateCreateInvoice(body = {}) {
  const errors = {};

  if (!body.recipientName || typeof body.recipientName !== 'string' || !body.recipientName.trim()) {
    errors.recipientName = 'Recipient name is required';
  }

  const invoiceType = body.invoiceType || body.invoice_type;
  if (!invoiceType || !VALID_INVOICE_TYPES.includes(invoiceType.toLowerCase())) {
    errors.invoiceType = `Invalid invoice type. Allowed: ${VALID_INVOICE_TYPES.join(', ')}`;
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'Invoice must contain at least one item';
  } else {
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item.description || typeof item.description !== 'string' || !item.description.trim()) {
        errors[`items[${i}].description`] = 'Item description is required';
      }
      const qty = Number(item.quantity !== undefined ? item.quantity : 1);
      if (isNaN(qty) || qty <= 0) {
        errors[`items[${i}].quantity`] = 'Item quantity must be greater than zero';
      }
      const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : item.unit_price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors[`items[${i}].unitPrice`] = 'Unit price must be a non-negative number';
      }
    }
  }

  if (body.discountAmount !== undefined) {
    const discount = Number(body.discountAmount);
    if (isNaN(discount) || discount < 0) {
      errors.discountAmount = 'Discount amount cannot be negative';
    }
  }

  if (body.taxAmount !== undefined) {
    const tax = Number(body.taxAmount);
    if (isNaN(tax) || tax < 0) {
      errors.taxAmount = 'Tax amount cannot be negative';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates payment recording
 */
function validateCreatePayment(body = {}) {
  const errors = {};

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Payment amount must be a positive number';
  }

  const method = (body.paymentMethod || body.payment_method || '').toLowerCase().trim();
  if (!method || !VALID_PAYMENT_METHODS.includes(method)) {
    errors.paymentMethod = `Invalid payment method. Allowed: ${VALID_PAYMENT_METHODS.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates expense creation
 */
function validateCreateExpense(body = {}) {
  const errors = {};

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.title = 'Expense title is required';
  }

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Expense amount must be a positive number';
  }

  const category = (body.category || '').toLowerCase().trim();
  if (!category || !VALID_EXPENSE_CATEGORIES.includes(category)) {
    errors.category = `Invalid expense category. Allowed: ${VALID_EXPENSE_CATEGORIES.join(', ')}`;
  }

  const method = (body.paymentMethod || body.payment_method || 'bank_transfer').toLowerCase().trim();
  if (!VALID_EXPENSE_PAYMENT_METHODS.includes(method)) {
    errors.paymentMethod = `Invalid payment method. Allowed: ${VALID_EXPENSE_PAYMENT_METHODS.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates report period parameter
 */
function validatePeriod(period) {
  if (!period || typeof period !== 'string') {
    return { isValid: true, period: 'today' };
  }
  const normalized = period.toLowerCase().trim();
  if (!VALID_PERIODS.includes(normalized)) {
    return {
      isValid: false,
      error: `Invalid period '${period}'. Allowed periods: ${VALID_PERIODS.join(', ')}`
    };
  }
  return { isValid: true, period: normalized };
}

module.exports = {
  VALID_INVOICE_TYPES,
  VALID_INVOICE_STATUSES,
  VALID_PAYMENT_METHODS,
  VALID_EXPENSE_CATEGORIES,
  VALID_EXPENSE_PAYMENT_METHODS,
  VALID_PERIODS,
  validateCreateInvoice,
  validateCreatePayment,
  validateCreateExpense,
  validatePeriod
};
