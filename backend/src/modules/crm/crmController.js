/**
 * Champions Club - CRM Controller
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const crmService = require('./crmService');
const {
  validateCreateLead,
  validateUpdateLead,
  validateCreateFollowup,
  validateCreateQuotation,
  validateCreateTrial
} = require('./crmValidators');

class CrmController {
  async createLead(req, res, next) {
    try {
      const validation = validateCreateLead(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid lead parameters',
          errors: validation.errors
        });
      }

      const lead = await crmService.createLead(req.body);
      res.status(201).json({
        success: true,
        data: lead,
        message: 'Enquiry submitted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async listLeads(req, res, next) {
    try {
      const { status, sport, search, limit, offset } = req.query;
      const leads = await crmService.getLeads({ status, sport, search, limit, offset });
      res.status(200).json({
        success: true,
        data: leads,
        count: leads.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getLeadById(req, res, next) {
    try {
      const { id } = req.params;
      const lead = await crmService.getLeadById(id);
      res.status(200).json({
        success: true,
        data: lead
      });
    } catch (err) {
      next(err);
    }
  }

  async updateLead(req, res, next) {
    try {
      const { id } = req.params;
      const validation = validateUpdateLead(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid lead updates',
          errors: validation.errors
        });
      }

      const lead = await crmService.updateLead(id, req.body);
      res.status(200).json({
        success: true,
        data: lead,
        message: 'Lead updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async createFollowup(req, res, next) {
    try {
      const { id } = req.params;
      const validation = validateCreateFollowup(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid followup parameters',
          errors: validation.errors
        });
      }

      const followup = await crmService.createFollowup(id, req.body, req.user?.id);
      res.status(201).json({
        success: true,
        data: followup,
        message: 'Follow-up logged successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getFollowups(req, res, next) {
    try {
      const { id } = req.params;
      const followups = await crmService.getFollowups(id);
      res.status(200).json({
        success: true,
        data: followups,
        count: followups.length
      });
    } catch (err) {
      next(err);
    }
  }

  async createQuotation(req, res, next) {
    try {
      const { id } = req.params;
      const validation = validateCreateQuotation(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid quotation parameters',
          errors: validation.errors
        });
      }

      const quotation = await crmService.createQuotation(id, req.body);
      res.status(201).json({
        success: true,
        data: quotation,
        message: 'Quotation generated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async createTrial(req, res, next) {
    try {
      const { id } = req.params;
      const validation = validateCreateTrial(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: validation.errors[0]?.message || 'Invalid trial parameters',
          errors: validation.errors
        });
      }

      const trial = await crmService.createTrial(id, req.body);
      res.status(201).json({
        success: true,
        data: trial,
        message: 'Trial session booked successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CrmController();
