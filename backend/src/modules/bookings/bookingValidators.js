/**
 * Champions Club - Booking Validation Helpers
 * Role: MEMBER 3 (Booking Engine Backend)
 */

const { validators } = require('../../middleware/validator');

function isThirtyMinuteInterval(dateObj, rawStr) {
  if (!dateObj || Number.isNaN(dateObj.getTime())) return false;

  if (typeof rawStr === 'string' && rawStr.includes(':')) {
    let timePart = rawStr;
    if (rawStr.includes('T')) {
      timePart = rawStr.split('T')[1];
    }
    const parts = timePart.split(':');
    if (parts.length >= 2) {
      const minutes = parseInt(parts[1], 10);
      if (minutes !== 0 && minutes !== 30) return false;
    }
  }

  const mins = dateObj.getUTCMinutes();
  const localMins = dateObj.getMinutes();
  return mins === 0 || mins === 30 || localMins === 0 || localMins === 30;
}

function isExactlyOneHour(startObj, endObj) {
  if (!startObj || !endObj || Number.isNaN(startObj.getTime()) || Number.isNaN(endObj.getTime())) {
    return false;
  }
  const diffMs = endObj.getTime() - startObj.getTime();
  return diffMs === 60 * 60 * 1000;
}

function validateCreateBooking(body) {
  const errors = [];
  let isSlotError = false;

  if (!validators.isNonEmptyString(body.courtId)) {
    errors.push({ field: 'courtId', message: 'courtId is required' });
  }

  const dateVal = body.bookingDate || body.date;
  if (!validators.isDateString(dateVal)) {
    errors.push({ field: 'bookingDate', message: 'Valid booking date is required (YYYY-MM-DD)' });
  }

  if (!validators.isNonEmptyString(body.startTime)) {
    errors.push({ field: 'startTime', message: 'startTime is required' });
    isSlotError = true;
  }

  if (!validators.isNonEmptyString(body.endTime)) {
    errors.push({ field: 'endTime', message: 'endTime is required' });
    isSlotError = true;
  }

  if (body.startTime && body.endTime) {
    const start = new Date(body.startTime);
    const end = new Date(body.endTime);

    if (Number.isNaN(start.getTime())) {
      errors.push({ field: 'startTime', message: 'Invalid startTime date format' });
      isSlotError = true;
    }

    if (Number.isNaN(end.getTime())) {
      errors.push({ field: 'endTime', message: 'Invalid endTime date format' });
      isSlotError = true;
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      if (end <= start) {
        errors.push({ field: 'endTime', message: 'endTime must be strictly after startTime' });
        isSlotError = true;
      } else if (!isExactlyOneHour(start, end)) {
        errors.push({ field: 'duration', message: 'Booking duration must be exactly 1 hour' });
        isSlotError = true;
      }

      if (!isThirtyMinuteInterval(start, body.startTime)) {
        errors.push({ field: 'startTime', message: 'Start time must occur on a 30-minute interval (:00 or :30)' });
        isSlotError = true;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isSlotError,
    errors
  };
}

module.exports = {
  isThirtyMinuteInterval,
  isExactlyOneHour,
  validateCreateBooking
};
