/**
 * Champions Club - Management Reporting Controller
 * Role: MEMBER 4 (Backend Operations - Executive Dashboard & Analytics)
 */

const reportService = require('./reportService');
const { validatePeriod } = require('../finance/financeValidators');

class ReportController {
  // GET /api/dashboard/summary
  async getDashboardSummary(req, res, next) {
    try {
      const periodValidation = validatePeriod(req.query.period);
      if (!periodValidation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: periodValidation.error
        });
      }

      const summary = await reportService.getDashboardSummary(periodValidation.period);
      res.status(200).json({
        success: true,
        summary,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/reports/revenue
  async getRevenueReport(req, res, next) {
    try {
      const periodValidation = validatePeriod(req.query.period);
      if (!periodValidation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: periodValidation.error
        });
      }

      const report = await reportService.getRevenueReport(periodValidation.period);
      res.status(200).json({
        success: true,
        report,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/reports/court-usage
  async getCourtUsageReport(req, res, next) {
    try {
      const periodValidation = validatePeriod(req.query.period);
      if (!periodValidation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: periodValidation.error
        });
      }

      const report = await reportService.getCourtUsageReport(periodValidation.period);
      res.status(200).json({
        success: true,
        report,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/reports/memberships
  async getMembershipsReport(req, res, next) {
    try {
      const periodValidation = validatePeriod(req.query.period);
      if (!periodValidation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: periodValidation.error
        });
      }

      const report = await reportService.getMembershipsReport(periodValidation.period);
      res.status(200).json({
        success: true,
        report,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/reports/sales
  async getSalesReport(req, res, next) {
    try {
      const periodValidation = validatePeriod(req.query.period);
      if (!periodValidation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: periodValidation.error
        });
      }

      const report = await reportService.getSalesReport(periodValidation.period);
      res.status(200).json({
        success: true,
        report,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
