/**
 * Champions Club - Finance Routes (Invoices, Payments & Expenses)
 * Role: MEMBER 4 (Backend Operations - Finance, Payments, Invoices & Reports)
 */

const express = require('express');
const financeController = require('./financeController');
const { authenticate, authorize } = require('../../middleware/auth');

// Router for /api/invoices
const invoiceRouter = express.Router();
invoiceRouter.get('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.getInvoices(req, res, next));
invoiceRouter.post('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.createInvoice(req, res, next));
invoiceRouter.get('/:id', authenticate, authorize('admin', 'manager', 'staff', 'member'), (req, res, next) => financeController.getInvoiceById(req, res, next));
invoiceRouter.patch('/:id/status', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.updateInvoiceStatus(req, res, next));

// Router for /api/payments
const paymentRouter = express.Router();
paymentRouter.get('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.getPayments(req, res, next));
paymentRouter.post('/', authenticate, authorize('admin', 'manager', 'staff', 'member'), (req, res, next) => financeController.createPayment(req, res, next));

// Router for /api/expenses
const expenseRouter = express.Router();
expenseRouter.get('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.getExpenses(req, res, next));
expenseRouter.post('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.createExpense(req, res, next));

// Router for /api/finance (Consolidated Financials, Tax & Payroll)
const financeRouter = express.Router();
financeRouter.get('/owner-summary', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.getOwnerSummary(req, res, next));
financeRouter.get('/tax-report', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.getTaxReport(req, res, next));
financeRouter.get('/payroll', authenticate, authorize('admin', 'manager', 'staff'), (req, res, next) => financeController.getPayrollSummary(req, res, next));
financeRouter.post('/payroll/disburse', authenticate, authorize('admin', 'manager'), (req, res, next) => financeController.disbursePayroll(req, res, next));

module.exports = {
  invoiceRouter,
  paymentRouter,
  expenseRouter,
  financeRouter
};

