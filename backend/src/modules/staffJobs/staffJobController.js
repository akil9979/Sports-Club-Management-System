/**
 * Champions Club - Staff Jobs & Permission Management Controller
 * Role: Scalable Database-Driven Staff Job Access Control (JBAC)
 */

const staffJobService = require('./staffJobService');

class StaffJobController {
  // --- PUBLIC / AUTHENTICATED ---
  async getActiveJobTypes(req, res, next) {
    try {
      const jobTypes = await staffJobService.getActiveJobTypes();
      res.status(200).json({
        success: true,
        data: jobTypes,
        count: jobTypes.length
      });
    } catch (err) {
      next(err);
    }
  }

  // --- ADMIN ONLY ---
  async getAllJobTypes(req, res, next) {
    try {
      const jobTypes = await staffJobService.getAllJobTypes();
      res.status(200).json({
        success: true,
        data: jobTypes,
        count: jobTypes.length
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllPermissions(req, res, next) {
    try {
      const result = await staffJobService.getAllPermissions();
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async createJobType(req, res, next) {
    try {
      const { name, code, description, permissionIds } = req.body;
      if (!name || !name.trim()) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Job name is required'
        });
      }

      const created = await staffJobService.createJobType({
        name,
        code,
        description,
        permissionIds
      });

      res.status(201).json({
        success: true,
        data: created,
        message: `Staff Job "${created.name}" created successfully`
      });
    } catch (err) {
      next(err);
    }
  }

  async updateJobType(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, isActive, permissionIds } = req.body;

      const updated = await staffJobService.updateJobType(id, {
        name,
        description,
        isActive,
        permissionIds
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: `Staff Job "${updated.name}" updated successfully`
      });
    } catch (err) {
      next(err);
    }
  }

  async getStaffMembers(req, res, next) {
    try {
      const staffMembers = await staffJobService.getStaffMembers();
      res.status(200).json({
        success: true,
        data: staffMembers,
        count: staffMembers.length
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStaffJob(req, res, next) {
    try {
      const { id } = req.params;
      const { staffJobTypeId } = req.body;

      if (!staffJobTypeId) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'staffJobTypeId is required'
        });
      }

      const result = await staffJobService.updateStaffJob(id, staffJobTypeId);
      res.status(200).json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStaffStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Status is required'
        });
      }

      const updated = await staffJobService.updateStaffStatus(id, status);
      res.status(200).json({
        success: true,
        data: updated,
        message: `Staff status updated to "${status}" successfully`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StaffJobController();
