/**
 * Champions Club - Booking Validation Helpers
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { validators } = require('../../middleware/validator');

function validateCreateBooking(body) {
  const errors = [];

  if (!validators.isNonEmptyString(body.courtId)) {
    errors.push({ field: 'courtId', message: 'courtId is required' });
  }

  if (!validators.isDateString(body.date) && !validators.isDateString(body.bookingDate)) {
    errors.push({ field: 'bookingDate', message: 'Valid booking date is required (YYYY-MM-DD)' });
  }

  if (!validators.isNonEmptyString(body.startTime)) {
    errors.push({ field: 'startTime', message: 'startTime is required' });
  }

  if (!validators.isNonEmptyString(body.endTime)) {
    errors.push({ field: 'endTime', message: 'endTime is required' });
  }

  const start = new Date(body.startTime);
  const end = new Date(body.endTime);

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (end <= start) {
      errors.push({ field: 'endTime', message: 'endTime must be strictly after startTime' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateCreateBooking
};
