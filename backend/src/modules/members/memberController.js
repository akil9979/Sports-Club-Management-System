/**
 * Champions Club - Members Controller
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const memberService = require('./memberService');
const membershipService = require('../memberships/membershipService');
const { validators } = require('../../middleware/validator');

class MemberController {
  async create(req, res, next) {
    try {
      let { 
        firstName, 
        lastName, 
        name,
        email, 
        phone, 
        gender, 
        dateOfBirth, 
        dob,
        address, 
        emergencyContact,
        emergencyContactName, 
        emergencyContactPhone, 
        password, 
        role, 
        planId, 
        billingCycle, 
        startDate, 
        endDate 
      } = req.body;

      if ((!firstName || !lastName) && name && typeof name === 'string') {
        const parts = name.trim().split(/\s+/);
        if (!firstName) firstName = parts[0] || '';
        if (!lastName) lastName = parts.slice(1).join(' ') || parts[0] || '';
      }

      if (!dateOfBirth && dob) {
        dateOfBirth = dob;
      }

      if (!emergencyContactPhone && emergencyContact) {
        emergencyContactPhone = emergencyContact;
      }

      if (!validators.isNonEmptyString(firstName, 1)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'First name is required' });
      }
      if (!validators.isNonEmptyString(lastName, 1)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'Last name is required' });
      }
      if (!validators.isEmail(email)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'Valid email is required' });
      }
      if (!validators.isNonEmptyString(phone, 1)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'Phone number is required' });
      }

      const member = await memberService.createMember({
        firstName,
        lastName,
        email,
        phone,
        gender,
        dateOfBirth,
        address,
        emergencyContactName,
        emergencyContactPhone,
        password,
        role,
        planId,
        billingCycle,
        startDate,
        endDate
      });

      res.status(201).json({
        success: true,
        data: member,
        message: 'Member created successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const { search, status, tier, limit, offset } = req.query;
      const members = await memberService.getMembers({ search, status, tier, limit, offset });
      res.status(200).json({
        success: true,
        data: members,
        count: members.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const member = await memberService.getMemberById(req.params.id);
      res.status(200).json({
        success: true,
        data: member
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await memberService.updateMember(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated,
        message: 'Member updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async createMembership(req, res, next) {
    try {
      const memberId = req.params.id;
      const { planId, billingCycle, startDate, endDate, autoRenew } = req.body;

      if (!validators.isNonEmptyString(planId)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'planId is required' });
      }

      const result = await membershipService.subscribe({
        memberId,
        planId,
        billingCycle,
        startDate,
        endDate,
        autoRenew
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Membership created successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemberships(req, res, next) {
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

module.exports = new MemberController();
