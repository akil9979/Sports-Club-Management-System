/**
 * Champions Club - Management Reporting & Dashboard Routes
 * Role: MEMBER 4 (Backend Operations - Executive Dashboard & Analytics)
 */

const express = require('express');
const reportController = require('./reportController');
const { authenticate, authorize } = require('../../middleware/auth');

// Router for /api/dashboard
const dashboardRouter = express.Router();
dashboardRouter.get('/summary', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => reportController.getDashboardSummary(req, res, next));

// Router for /api/reports
const reportRouter = express.Router();
reportRouter.get('/revenue', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => reportController.getRevenueReport(req, res, next));
reportRouter.get('/court-usage', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => reportController.getCourtUsageReport(req, res, next));
reportRouter.get('/memberships', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => reportController.getMembershipsReport(req, res, next));
reportRouter.get('/sales', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => reportController.getSalesReport(req, res, next));

module.exports = {
  dashboardRouter,
  reportRouter
};
