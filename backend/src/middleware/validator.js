/**
 * Champions Club - Plain JavaScript Request Validation Helpers
 * Role: MEMBER 3 (Canonical Database Owner)
 * Note: Pure JS validation without external validation libraries (No Zod/Joi/Yup).
 */

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 422;
    this.errors = errors;
  }
}

const validators = {
  isEmail(value) {
    if (typeof value !== 'string') return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim());
  },

  isNonEmptyString(value, minLen = 1, maxLen = 255) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return trimmed.length >= minLen && trimmed.length <= maxLen;
  },

  isPositiveNumber(value) {
    const num = Number(value);
    return !Number.isNaN(num) && num > 0;
  },

  isNonNegativeNumber(value) {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 0;
  },

  isDateString(value) {
    if (typeof value !== 'string') return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime());
  },

  isISOTime(value) {
    if (typeof value !== 'string') return false;
    const d = new Date(value);
    return !Number.isNaN(d.getTime()) && value.includes('T');
  },

  isIn(value, allowedValues) {
    return Array.isArray(allowedValues) && allowedValues.includes(value);
  },

  isUUID(value) {
    if (typeof value !== 'string') return false;
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return re.test(value);
  }
};

/**
 * Middleware factory for validating request body
 * @param {Function} validatorFn - Function receiving req.body and returning { isValid, errors }
 */
function validateBody(validatorFn) {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body || {});
    if (!isValid) {
      return next(new ValidationError('Validation failed', errors));
    }
    next();
  };
}

module.exports = {
  ValidationError,
  validators,
  validateBody
};
