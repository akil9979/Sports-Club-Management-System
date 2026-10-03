/**
 * Champions Club - Membership Controller
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const membershipService = require('./membershipService');
const { validators } = require('../../middleware/validator');

class MembershipController {
  async getPlans(req, res, next) {
    try {
      const plans = await membershipService.getPlans();
      res.status(200).json(plans);
    } catch (err) {
      next(err);
    }
  }

  async getPlanById(req, res, next) {
    try {
      const plan = await membershipService.getPlanById(req.params.id);
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (err) {
      next(err);
    }
  }

  async subscribe(req, res, next) {
    try {
      const { memberId, planId, billingCycle, startDate, endDate, autoRenew } = req.body;

      if (!validators.isNonEmptyString(memberId)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'memberId is required' });
      }
      if (!validators.isNonEmptyString(planId)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'planId is required' });
      }

      const result = await membershipService.subscribe({ memberId, planId, billingCycle, startDate, endDate, autoRenew });
      res.status(201).json({
        success: true,
        data: result,
        message: 'Membership subscription created successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async subscribeForMember(req, res, next) {
    try {
      const memberId = req.params.id;
      const { planId, billingCycle, startDate, endDate, autoRenew } = req.body;

      if (!validators.isNonEmptyString(planId)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'planId is required' });
      }

      const result = await membershipService.subscribe({ memberId, planId, billingCycle, startDate, endDate, autoRenew });
      res.status(201).json({
        success: true,
        data: result,
        message: 'Membership subscription created successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemberMemberships(req, res, next) {
    try {
      const memberId = req.params.id;
      const memberships = await membershipService.getMemberMemberships(memberId);
      res.status(200).json({
        success: true,
        data: memberships,
        count: memberships.length
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MembershipController();
