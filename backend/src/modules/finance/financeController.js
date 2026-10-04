/**
 * Champions Club - Finance Controller
 * Role: MEMBER 4 (Backend Operations - Finance, Payments, Invoices & Reporting)
 */

const financeService = require('./financeService');
const {
  validateCreateInvoice,
  validateCreatePayment,
  validateCreateExpense
} = require('./financeValidators');

class FinanceController {
  // ==========================================
  // INVOICES
  // ==========================================

  // GET /api/invoices
  async getInvoices(req, res, next) {
    try {
      const invoices = await financeService.getInvoices(req.query);
      res.status(200).json({
        success: true,
        count: invoices.length,
        invoices,
        data: invoices
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/invoices/:id
  async getInvoiceById(req, res, next) {
    try {
      const invoice = await financeService.getInvoiceById(req.params.id);
      res.status(200).json({
        success: true,
        invoice,
        data: invoice
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/invoices
  async createInvoice(req, res, next) {
    try {
      const validation = validateCreateInvoice(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid invoice details',
          errors: validation.errors
        });
      }

      const invoice = await financeService.createInvoice(req.body);
      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        invoice,
        data: invoice
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PAYMENTS
  // ==========================================

  // GET /api/payments
  async getPayments(req, res, next) {
    try {
      const payments = await financeService.getPayments(req.query);
      res.status(200).json({
        success: true,
        count: payments.length,
        payments,
        data: payments
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/payments
  async createPayment(req, res, next) {
    try {
      const validation = validateCreatePayment(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid payment parameters',
          errors: validation.errors
        });
      }

      const payment = await financeService.createPayment(req.body);
      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        payment,
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // EXPENSES
  // ==========================================

  // GET /api/expenses
  async getExpenses(req, res, next) {
    try {
      const expenses = await financeService.getExpenses(req.query);
      res.status(200).json({
        success: true,
        count: expenses.length,
        expenses,
        data: expenses
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/expenses
  async createExpense(req, res, next) {
    try {
      const validation = validateCreateExpense(req.body);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid expense parameters',
          errors: validation.errors
        });
      }

      const payload = {
        ...req.body,
        approvedBy: req.user?.id || req.body.approvedBy || null
      };

      const expense = await financeService.createExpense(payload);
      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        expense,
        data: expense
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/invoices/:id/status
  async updateInvoiceStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      const updated = await financeService.updateInvoiceStatus(req.params.id, status, notes);
      res.status(200).json({
        success: true,
        message: `Invoice status updated to '${status}'`,
        invoice: updated,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // OWNER EXECUTIVE FINANCIAL SUMMARY
  // ==========================================

  // GET /api/finance/owner-summary (or /api/dashboard/owner-summary)
  async getOwnerSummary(req, res, next) {
    try {
      const period = req.query.period || 'month';
      const summary = await financeService.getOwnerSummary(period);
      res.status(200).json({
        success: true,
        period,
        summary,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/finance/tax-report
  async getTaxReport(req, res, next) {
    try {
      const period = req.query.period || 'month';
      const report = await financeService.getTaxReport(period);
      res.status(200).json({
        success: true,
        period,
        report,
        data: report
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/finance/payroll
  async getPayrollSummary(req, res, next) {
    try {
      const period = req.query.period || 'month';
      const payroll = await financeService.getPayrollSummary(period);
      res.status(200).json({
        success: true,
        period,
        payroll,
        data: payroll
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/finance/payroll/disburse
  async disbursePayroll(req, res, next) {
    try {
      const payload = {
        ...req.body,
        approvedBy: req.user?.id || req.body.approvedBy || null
      };
      const result = await financeService.disbursePayroll(payload);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FinanceController();

