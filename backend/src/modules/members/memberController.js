/**
 * Champions Club - Members Controller
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const memberService = require('./memberService');

class MemberController {
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
}

module.exports = new MemberController();
