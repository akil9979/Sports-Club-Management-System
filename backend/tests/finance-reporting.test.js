/**
 * Champions Club - Finance, Payments, Invoices & Management Reporting Test Suite
 * Role: MEMBER 4 (Backend Operations - Finance & Analytics Integration)
 */

const http = require('http');
const app = require('../src/app');
const { initSchema } = require('../src/db/init');
const { seedDatabase } = require('../src/db/seed');
const { pool, query } = require('../src/config/database');

let server;
let baseUrl;
let adminToken;
let staffToken;
let memberToken;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n================================================================');
  console.log(' CHAMPIONS CLUB - FINANCE & MANAGEMENT REPORTING TEST SUITE');
  console.log(' Role: MEMBER 4 (Finance, Payments, Invoicing & Analytics)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Initialize Schema & Seed Data
    console.log('[SETUP] Initializing schema and seed data...');
    await initSchema();
    await seedDatabase();

    // 2. Start HTTP Test Server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`[SETUP] Test server running on ${baseUrl}\n`);
        resolve();
      });
    });

    // 3. Obtain Auth Tokens
    console.log('[AUTH] Logging in test users...');
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@championsclub.com', password: 'Password@123' }
    });
    adminToken = adminLogin.body.data?.token || adminLogin.body.token;

    const staffLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'priya.nair@championsclub.com', password: 'Password@123' }
    });
    staffToken = staffLogin.body.data?.token || staffLogin.body.token;

    const memberLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'devon.conway@example.com', password: 'Password@123' }
    });
    memberToken = memberLogin.body.data?.token || memberLogin.body.token;

    assert(!!adminToken, 'Admin token acquired');
    assert(!!staffToken, 'Staff token acquired');
    assert(!!memberToken, 'Member token acquired');

    // ========================================================================
    // SUITE 1: SECURITY & ROLE-BASED ACCESS CONTROL
    // ========================================================================
    console.log('\n--- SUITE 1: SECURITY & RBAC TESTS ---');

    // 1.1 Unauthorized dashboard access without token
    const unauthDashboard = await request('/api/dashboard/summary');
    assert(unauthDashboard.status === 401, 'Rejects unauthenticated dashboard access with 401 Unauthorized');

    // 1.2 Member role forbidden from management dashboard
    const memberDashboard = await request('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    assert(memberDashboard.status === 403, 'Rejects member role from financial dashboard with 403 Forbidden');

    // 1.3 Admin allowed access
    const adminDashboard = await request('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminDashboard.status === 200, 'Allows admin access to financial dashboard with 200 OK');

    // 1.4 Staff allowed access
    const staffDashboard = await request('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffDashboard.status === 200, 'Allows staff access to financial dashboard with 200 OK');

    // ========================================================================
    // SUITE 2: INVOICING LIFECYCLE & VALIDATION
    // ========================================================================
    console.log('\n--- SUITE 2: INVOICES CRUD & VALIDATION ---');

    // 2.1 Create Invoice with items, subtotal, discount, tax calculation
    const createInvoiceRes = await request('/api/invoices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        recipientName: 'Vikram Mehta',
        recipientEmail: 'vikram.mehta@example.com',
        invoiceType: 'membership',
        items: [
          { description: 'Annual Gold Tier Subscription', quantity: 1, unitPrice: 24000.00, taxRate: 18.0 }
        ],
        discountAmount: 2000.00,
        taxAmount: 3960.00
      }
    });

    assert(createInvoiceRes.status === 201, 'Creates invoice with 201 Created');
    const createdInvoice = createInvoiceRes.body.data;
    assert(createdInvoice && createdInvoice.id, 'Invoice returns valid ID');
    assert(createdInvoice.totalAmount === 25960.00, `Invoice calculated total is 25960.00 (got ${createdInvoice.totalAmount})`);
    assert(createdInvoice.balanceDue === 25960.00, 'Balance due is initially equal to totalAmount');
    assert(createdInvoice.status === 'unpaid', 'Invoice initial status is unpaid');

    // 2.2 Retrieve invoice by ID
    const getInvoiceRes = await request(`/api/invoices/${createdInvoice.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(getInvoiceRes.status === 200, 'Retrieves invoice by ID with 200 OK');
    assert(getInvoiceRes.body.data.items.length === 1, 'Invoice details include item lines');

    // 2.3 List Invoices with filter
    const listInvoicesRes = await request('/api/invoices?status=unpaid', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listInvoicesRes.status === 200, 'Lists invoices with status filter');
    assert(Array.isArray(listInvoicesRes.body.data), 'Invoices response is an array');

    // 2.4 Invoice Validation: non-positive quantity / invalid type
    const invalidInvoice = await request('/api/invoices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        recipientName: 'Test',
        invoiceType: 'invalid_type',
        items: [{ description: 'Test', quantity: 0, unitPrice: 100 }]
      }
    });
    assert(invalidInvoice.status === 422, 'Rejects invalid invoice parameters with 422 Unprocessable Entity');

    // ========================================================================
    // SUITE 3: PAYMENTS RECORDING & INVOICE SETTLEMENT
    // ========================================================================
    console.log('\n--- SUITE 3: PAYMENTS RECORDING & INVOICE SETTLEMENT ---');

    // 3.1 Record partial payment via UPI against invoice
    const partialPaymentRes = await request('/api/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        invoiceId: createdInvoice.id,
        amount: 10000.00,
        paymentMethod: 'upi',
        transactionReference: 'UPI-TEST-998877',
        notes: 'First installment via UPI'
      }
    });

    assert(partialPaymentRes.status === 201, 'Records partial payment with 201 Created');
    const paymentRecord = partialPaymentRes.body.data;
    assert(paymentRecord.paymentMethod === 'upi', 'Payment method is UPI');
    assert(paymentRecord.amount === 10000.00, 'Payment amount is 10000.00');

    // Verify invoice status updated to partially_paid
    const checkPartialInv = await request(`/api/invoices/${createdInvoice.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(checkPartialInv.body.data.status === 'partially_paid', 'Invoice updated to partially_paid');
    assert(checkPartialInv.body.data.paidAmount === 10000.00, 'Invoice paidAmount is 10000.00');
    assert(checkPartialInv.body.data.balanceDue === 15960.00, 'Invoice balanceDue is 15960.00');

    // 3.2 Record remaining payment via Card to complete invoice
    const finalPaymentRes = await request('/api/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        invoiceId: createdInvoice.id,
        amount: 15960.00,
        paymentMethod: 'card',
        transactionReference: 'CARD-AUTH-887766'
      }
    });
    assert(finalPaymentRes.status === 201, 'Records final payment with 201 Created');

    // Verify invoice status is now 'paid'
    const checkPaidInv = await request(`/api/invoices/${createdInvoice.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(checkPaidInv.body.data.status === 'paid', 'Invoice status transitioned to paid');
    assert(checkPaidInv.body.data.balanceDue === 0, 'Invoice balanceDue is now 0');

    // 3.3 List Payments with method filter
    const listPaymentsRes = await request('/api/payments?paymentMethod=upi', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listPaymentsRes.status === 200, 'Lists payments filtered by UPI');
    assert(listPaymentsRes.body.data.length >= 1, 'Payments list returns at least 1 UPI payment');

    // 3.4 Payment Validation: negative amount
    const invalidPayment = await request('/api/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { amount: -500, paymentMethod: 'cash' }
    });
    assert(invalidPayment.status === 422, 'Rejects negative payment amount with 422');

    // ========================================================================
    // SUITE 4: EXPENSES TRACKING & VALIDATION
    // ========================================================================
    console.log('\n--- SUITE 4: EXPENSES CRUD & VALIDATION ---');

    // 4.1 Record Expense
    const createExpenseRes = await request('/api/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Court 1 Floodlight Repair & Maintenance',
        amount: 4500.00,
        category: 'maintenance',
        paymentMethod: 'bank_transfer',
        vendorName: 'Apex Lighting Solutions',
        notes: 'Replaced 2 LED ballast units'
      }
    });
    assert(createExpenseRes.status === 201, 'Records expense with 201 Created');
    const createdExpense = createExpenseRes.body.data;
    assert(createdExpense && createdExpense.amount === 4500.00, 'Expense amount is 4500.00');
    assert(createdExpense.category === 'maintenance', 'Expense category is maintenance');

    // 4.2 List Expenses
    const listExpensesRes = await request('/api/expenses?category=maintenance', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listExpensesRes.status === 200, 'Lists expenses with category filter');
    assert(listExpensesRes.body.data.length >= 1, 'Returns at least 1 maintenance expense');

    // 4.3 Expense Validation: missing title / non-positive amount
    const invalidExpense = await request('/api/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: '', amount: 0, category: 'unknown_cat' }
    });
    assert(invalidExpense.status === 422, 'Rejects invalid expense parameters with 422');

    // ========================================================================
    // SUITE 5: DASHBOARD SUMMARY (TODAY / WEEK / MONTH) & AGGREGATIONS
    // ========================================================================
    console.log('\n--- SUITE 5: REAL DATABASE DASHBOARD SUMMARY (TODAY/WEEK/MONTH) ---');

    // 5.1 Dashboard Summary Today
    const todaySummaryRes = await request('/api/dashboard/summary?period=today', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(todaySummaryRes.status === 200, 'Fetches today dashboard summary with 200 OK');
    const todaySummary = todaySummaryRes.body.data;
    assert(todaySummary.period === 'today', 'Summary reflects today period');
    assert(typeof todaySummary.totalRevenue === 'number' && !isNaN(todaySummary.totalRevenue), 'Total revenue is a valid number');
    assert(typeof todaySummary.totalExpenses === 'number' && !isNaN(todaySummary.totalExpenses), 'Total expenses is a valid number');
    assert(typeof todaySummary.netIncome === 'number' && !isNaN(todaySummary.netIncome), 'Net income is a valid number');
    assert(todaySummary.revenueBySource !== undefined, 'Summary includes revenueBySource');
    assert(todaySummary.operationalMetrics !== undefined, 'Summary includes operationalMetrics');

    // 5.2 Dashboard Summary Week & Month
    const weekSummaryRes = await request('/api/dashboard/summary?period=week', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(weekSummaryRes.status === 200, 'Fetches week dashboard summary');

    const monthSummaryRes = await request('/api/dashboard/summary?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(monthSummaryRes.status === 200, 'Fetches month dashboard summary');

    // 5.3 Invalid period parameter rejected
    const invalidPeriod = await request('/api/dashboard/summary?period=century', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invalidPeriod.status === 422, 'Rejects invalid period parameter with 422');

    // ========================================================================
    // SUITE 6: DYNAMIC REVENUE RECALCULATION & TRACEABILITY
    // ========================================================================
    console.log('\n--- SUITE 6: DYNAMIC REVENUE RECALCULATION & TRACEABILITY ---');

    // 6.1 Record Bar Order & Settle It with Cash
    const barOrderRes = await request('/api/bar/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        tableId: 'table-2',
        guestName: 'Arjun Verma',
        items: [{ itemId: 'bev-1', quantity: 2 }]
      }
    });
    assert(barOrderRes.status === 201, 'Creates open bar tab');
    const barOrder = barOrderRes.body.order || barOrderRes.body.data;

    // Settle bar order
    const settleRes = await request(`/api/bar/orders/${barOrder.id}/settle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        paymentMethod: 'cash',
        amount: barOrder.total
      }
    });
    assert(settleRes.status === 200, 'Settles bar order with cash');

    // 6.2 Place Paid Shop Order
    const shopOrderRes = await request('/api/shop/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        customerName: 'Karan Mehra',
        orderType: 'counter',
        paymentStatus: 'paid',
        items: [{ productId: 'prod-2', quantity: 2 }]
      }
    });
    assert(shopOrderRes.status === 201, 'Places paid shop order');

    // 6.3 Verify Dashboard reflects new real revenue
    const updatedSummaryRes = await request('/api/dashboard/summary?period=today', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const updatedSummary = updatedSummaryRes.body.data;
    assert(updatedSummary.revenueBySource.bar >= barOrder.total, 'Dashboard bar revenue dynamically reflects settled bar tab');
    assert(updatedSummary.revenueBySource.shop > 0, 'Dashboard shop revenue dynamically reflects paid shop order');

    // ========================================================================
    // SUITE 7: DETAILED MANAGEMENT REPORTS
    // ========================================================================
    console.log('\n--- SUITE 7: DETAILED MANAGEMENT REPORTS ---');

    // 7.1 Revenue Report
    const revReportRes = await request('/api/reports/revenue?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(revReportRes.status === 200, 'Fetches revenue report with 200 OK');
    const revReport = revReportRes.body.data;
    assert(Array.isArray(revReport.sources), 'Revenue report includes source breakdown array');
    assert(Array.isArray(revReport.paymentMethods), 'Revenue report includes payment methods breakdown array');
    assert(typeof revReport.grossRevenue === 'number', 'Gross revenue is a valid number');

    // 7.2 Court Usage Report
    const courtReportRes = await request('/api/reports/court-usage?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(courtReportRes.status === 200, 'Fetches court usage report with 200 OK');
    const courtReport = courtReportRes.body.data;
    assert(courtReport.activeCourts >= 1, 'Court report includes active court count');
    assert(Array.isArray(courtReport.bySport), 'Court report includes bySport breakdown');
    assert(Array.isArray(courtReport.byCourt), 'Court report includes byCourt breakdown');
    assert(typeof courtReport.overallUtilizationRate === 'number', 'Court report includes utilization rate percentage');

    // 7.3 Memberships Report
    const memReportRes = await request('/api/reports/memberships?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(memReportRes.status === 200, 'Fetches memberships report with 200 OK');
    const memReport = memReportRes.body.data;
    assert(memReport.totalRegisteredMembers >= 1, 'Memberships report includes total registered members');
    assert(Array.isArray(memReport.planDistribution), 'Memberships report includes plan tier distribution');

    // 7.4 Sales Report (Shop + Bar)
    const salesReportRes = await request('/api/reports/sales?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(salesReportRes.status === 200, 'Fetches sales report with 200 OK');
    const salesReport = salesReportRes.body.data;
    assert(salesReport.shop !== undefined, 'Sales report contains shop metrics');
    assert(salesReport.bar !== undefined, 'Sales report contains bar metrics');
    assert(Array.isArray(salesReport.shop.topProducts), 'Sales report contains shop top products');
    assert(Array.isArray(salesReport.bar.topItems), 'Sales report contains bar top items');

    // ========================================================================
    // SUITE 8: OWNER MONTH-END FINANCIAL HUB & OPERATIONS
    // ========================================================================
    console.log('\n--- SUITE 8: OWNER MONTH-END FINANCIAL HUB & OPERATIONS ---');

    // 8.1 Owner Month-End Consolidated Summary (How much earned, from where, and what is owed)
    const ownerSummaryRes = await request('/api/finance/owner-summary?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(ownerSummaryRes.status === 200, 'Fetches Owner Summary with 200 OK');
    const ownerSummary = ownerSummaryRes.body.data || ownerSummaryRes.body.summary;
    assert(ownerSummary.overview !== undefined, 'Owner summary has overview block');
    assert(typeof ownerSummary.overview.grossRevenue === 'number', 'Overview has numeric grossRevenue');
    assert(typeof ownerSummary.overview.netIncome === 'number', 'Overview has numeric netIncome');
    assert(typeof ownerSummary.overview.totalReceivables === 'number', 'Overview has numeric totalReceivables');
    assert(typeof ownerSummary.overview.totalPayables === 'number', 'Overview has numeric totalPayables');
    assert(Array.isArray(ownerSummary.revenueBySource), 'Owner summary contains revenueBySource breakdown');
    assert(Array.isArray(ownerSummary.paymentChannels), 'Owner summary contains paymentChannels breakdown (card, cash, upi, netbanking)');
    assert(ownerSummary.receivables !== undefined, 'Owner summary contains receivables analysis');
    assert(ownerSummary.payablesAndLiabilities !== undefined, 'Owner summary contains payables & liabilities');
    assert(ownerSummary.taxes !== undefined, 'Owner summary contains taxes calculation');
    assert(ownerSummary.payroll !== undefined, 'Owner summary contains payroll overview');

    // 8.2 Tax Report & Statutory Filing
    const taxReportRes = await request('/api/finance/tax-report?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(taxReportRes.status === 200, 'Fetches Tax Report with 200 OK');
    const taxReport = taxReportRes.body.data || taxReportRes.body.report;
    assert(taxReport.taxes !== undefined, 'Tax report has taxes object');
    assert(typeof taxReport.taxes.totalOutputTax === 'number', 'Tax report has output tax amount');
    assert(typeof taxReport.taxes.netTaxPayable === 'number', 'Tax report has net tax payable');

    // 8.3 Staff Payroll Calculation
    const payrollRes = await request('/api/finance/payroll?period=month', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(payrollRes.status === 200, 'Fetches Payroll Summary with 200 OK');
    const payrollData = payrollRes.body.data || payrollRes.body.payroll;
    assert(payrollData.activeHeadcount >= 1, 'Payroll summary has active headcount');
    assert(typeof payrollData.totalGrossPayroll === 'number', 'Payroll summary has calculated total gross payroll');
    assert(Array.isArray(payrollData.departments), 'Payroll summary has department breakdown');
    assert(Array.isArray(payrollData.employees), 'Payroll summary has employee wage roster');

    // 8.4 Disburse Payroll
    const disburseRes = await request('/api/finance/payroll/disburse', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        department: 'all',
        paymentMethod: 'bank_transfer',
        periodName: 'October 2026'
      }
    });
    assert(disburseRes.status === 200, 'POST /api/finance/payroll/disburse executes successfully');
    assert(disburseRes.body.success === true, 'Payroll disbursement returns success');
    assert(disburseRes.body.expense !== undefined, 'Payroll disbursement generates linked salary expense');

    // 8.5 Create & Update Invoice Status
    const testInv = await request('/api/invoices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        recipientName: 'Corporate Tech Client',
        invoiceType: 'general',
        items: [{ description: 'Annual Arena Package', quantity: 1, unitPrice: 30000 }]
      }
    });
    assert(testInv.status === 201, 'Creates corporate test invoice with 201 Created');
    const invId = testInv.body.data?.id;

    const updateInvRes = await request(`/api/invoices/${invId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'paid', notes: 'Settled via wire transfer' }
    });
    assert(updateInvRes.status === 200, 'PATCH /api/invoices/:id/status updates status with 200 OK');
    assert(updateInvRes.body.invoice.status === 'paid', 'Invoice status updated to paid');


  } catch (err) {
    console.error('[UNEXPECTED TEST ERROR]:', err);
    failed++;
  }
 finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }

  console.log('\n================================================================');
  console.log(` TEST RUN SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
