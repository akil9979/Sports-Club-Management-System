/**
 * Champions Club - CRM Validation Helpers
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const { validators } = require('../../middleware/validator');

const CANONICAL_LEAD_STATUSES = ['new', 'contacted', 'trial_booked', 'quoted', 'converted', 'lost'];
const CANONICAL_CONTACT_METHODS = ['phone', 'email', 'whatsapp', 'in_person'];

function validateCreateLead(body) {
  const errors = [];

  if (!validators.isNonEmptyString(body.name)) {
    errors.push({ field: 'name', message: 'Lead full name is required' });
  }

  if (!validators.isEmail(body.email)) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!validators.isNonEmptyString(body.phone)) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUpdateLead(body) {
  const errors = [];

  if (body.name !== undefined && !validators.isNonEmptyString(body.name)) {
    errors.push({ field: 'name', message: 'Lead full name cannot be empty' });
  }

  if (body.email !== undefined && !validators.isEmail(body.email)) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (body.phone !== undefined && !validators.isNonEmptyString(body.phone)) {
    errors.push({ field: 'phone', message: 'Phone number cannot be empty' });
  }

  if (body.status !== undefined && !CANONICAL_LEAD_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      message: `Invalid status '${body.status}'. Must be one of: ${CANONICAL_LEAD_STATUSES.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCreateFollowup(body) {
  const errors = [];

  const summary = body.summary || body.note;
  if (!validators.isNonEmptyString(summary)) {
    errors.push({ field: 'summary', message: 'Follow-up summary note is required' });
  }

  const method = body.contactMethod || body.contact_method || 'phone';
  if (!CANONICAL_CONTACT_METHODS.includes(method)) {
    errors.push({
      field: 'contactMethod',
      message: `Invalid contact method. Must be one of: ${CANONICAL_CONTACT_METHODS.join(', ')}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCreateQuotation(body) {
  const errors = [];

  if (!validators.isNonEmptyString(body.title)) {
    errors.push({ field: 'title', message: 'Quotation title is required' });
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Quote amount must be a positive number' });
  }

  const validUntil = body.validUntil || body.valid_until;
  if (!validators.isDateString(validUntil)) {
    errors.push({ field: 'validUntil', message: 'Valid expiration date (YYYY-MM-DD) is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCreateTrial(body) {
  const errors = [];

  const courtId = body.courtId || body.court_id;
  if (!validators.isNonEmptyString(courtId)) {
    errors.push({ field: 'courtId', message: 'courtId is required for trial session' });
  }

  const scheduledTime = body.scheduledTime || body.scheduled_time;
  if (!validators.isNonEmptyString(scheduledTime) || Number.isNaN(new Date(scheduledTime).getTime())) {
    errors.push({ field: 'scheduledTime', message: 'Valid scheduledTime timestamp is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  CANONICAL_LEAD_STATUSES,
  CANONICAL_CONTACT_METHODS,
  validateCreateLead,
  validateUpdateLead,
  validateCreateFollowup,
  validateCreateQuotation,
  validateCreateTrial
};
