/**
 * Champions Club - Management & Staff Operations Validation Helpers
 * Role: MEMBER 2 (Management Dashboard & Employee/Leave Interfaces)
 */

export const SUPPORTED_PERIODS = ['today', 'week', 'month'];

/**
 * Validate that a period string is one of the supported values
 */
export function validatePeriod(period) {
  if (!period || typeof period !== 'string') {
    return {
      isValid: false,
      error: `Period is required. Supported values: ${SUPPORTED_PERIODS.join(', ')}`
    };
  }

  const normalized = period.toLowerCase().trim();
  if (!SUPPORTED_PERIODS.includes(normalized)) {
    return {
      isValid: false,
      error: `Invalid period '${period}'. Supported values: ${SUPPORTED_PERIODS.join(', ')}`
    };
  }

  return {
    isValid: true,
    period: normalized
  };
}

/**
 * Validate leave approval or rejection action
 */
export function validateLeaveAction({ id, action, confirmation }) {
  const errors = {};

  if (!id) {
    errors.id = 'Leave request ID is required';
  }

  if (!action || !['approve', 'reject'].includes(action)) {
    errors.action = "Action must be either 'approve' or 'reject'";
  }

  if (confirmation !== true) {
    errors.confirmation = 'Action confirmation is required to proceed';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format currency in Indian Rupees (₹)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Compute percentage ratio safely
 */
export function computePercentage(part, total) {
  if (!total || total <= 0) return 0;
  return Math.round(((Number(part) || 0) / Number(total)) * 100);
}
