/**
 * Champions Club - Finance Service (Invoices, Payments & Expenses)
 * Role: MEMBER 4 (Backend Operations - Finance, Payments, Invoices & Reporting)
 */

const { query, withTransaction } = require('../../config/database');

function formatInvoice(row, items = [], payments = []) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    memberId: row.member_id,
    leadId: row.lead_id,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    invoiceType: row.invoice_type,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    subtotal: parseFloat(row.subtotal || 0),
    discountAmount: parseFloat(row.discount_amount || 0),
    taxAmount: parseFloat(row.tax_amount || 0),
    totalAmount: parseFloat(row.total_amount || 0),
    paidAmount: parseFloat(row.paid_amount || 0),
    balanceDue: Math.max(0, parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0)),
    status: row.status,
    items: items.map(it => ({
      id: it.id,
      invoiceId: it.invoice_id,
      description: it.description,
      quantity: parseFloat(it.quantity || 1),
      unitPrice: parseFloat(it.unit_price || 0),
      taxRate: parseFloat(it.tax_rate || 0),
      totalPrice: parseFloat(it.total_price || 0),
      referenceType: it.reference_type,
      referenceId: it.reference_id,
      createdAt: it.created_at
    })),
    payments: payments.map(p => ({
      id: p.id,
      paymentNumber: p.payment_number,
      amount: parseFloat(p.amount || 0),
      paymentMethod: p.payment_method,
      transactionReference: p.transaction_reference,
      status: p.status,
      paidAt: p.paid_at,
      notes: p.notes
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function formatPayment(row) {
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number || null,
    memberId: row.member_id,
    memberName: row.member_name || null,
    amount: parseFloat(row.amount || 0),
    paymentMethod: row.payment_method,
    transactionReference: row.transaction_reference,
    status: row.status,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at
  };
}

function formatExpense(row) {
  return {
    id: row.id,
    expenseNumber: row.expense_number,
    category: row.category,
    title: row.title,
    amount: parseFloat(row.amount || 0),
    expenseDate: row.expense_date,
    vendorName: row.vendor_name,
    receiptUrl: row.receipt_url,
    paymentMethod: row.payment_method,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name || null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class FinanceService {
  // ==========================================
  // INVOICES
  // ==========================================

  /**
   * Get list of invoices with optional filters
   */
  async getInvoices({
    status = null,
    memberId = null,
    invoiceType = null,
    startDate = null,
    endDate = null,
    limit = 50,
    offset = 0
  } = {}) {
    let sql = `
      SELECT i.*, 
             COALESCE(m.first_name || ' ' || m.last_name, i.recipient_name) AS member_name,
             COUNT(ii.id) AS items_count
      FROM invoices i
      LEFT JOIN members m ON m.id = i.member_id
      LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (memberId) {
      params.push(memberId);
      sql += ` AND i.member_id = $${params.length}`;
    }

    if (invoiceType) {
      params.push(invoiceType);
      sql += ` AND i.invoice_type = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND i.issue_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND i.issue_date <= $${params.length}`;
    }

    sql += ` GROUP BY i.id, m.first_name, m.last_name ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows.map(row => formatInvoice(row));
  }

  /**
   * Get single invoice with all items and linked payments
   */
  async getInvoiceById(id) {
    const invoiceRes = await query(
      `SELECT i.*, COALESCE(m.first_name || ' ' || m.last_name, i.recipient_name) AS member_name
       FROM invoices i
       LEFT JOIN members m ON m.id = i.member_id
       WHERE i.id::text = $1 OR i.invoice_number = $1`,
      [id]
    );

    if (invoiceRes.rowCount === 0) {
      const error = new Error(`Invoice '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const invoice = invoiceRes.rows[0];

    const [itemsRes, paymentsRes] = await Promise.all([
      query(
        `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`,
        [invoice.id]
      ),
      query(
        `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_at DESC`,
        [invoice.id]
      )
    ]);

    return formatInvoice(invoice, itemsRes.rows, paymentsRes.rows);
  }

  /**
   * Create invoice and line items transactionally
   */
  async createInvoice(payload = {}) {
    const memberId = payload.memberId || payload.member_id || null;
    const leadId = payload.leadId || payload.lead_id || null;
    let recipientName = (payload.recipientName || payload.recipient_name || '').trim();
    let recipientEmail = payload.recipientEmail || payload.recipient_email || null;
    const invoiceType = (payload.invoiceType || payload.invoice_type || 'general').toLowerCase();
    const issueDate = payload.issueDate || payload.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = payload.dueDate || payload.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const items = payload.items || [];
    const discountAmount = parseFloat(payload.discountAmount || payload.discount_amount || 0);
    const taxAmount = parseFloat(payload.taxAmount || payload.tax_amount || 0);
    const status = (payload.status || 'unpaid').toLowerCase();

    return withTransaction(async (client) => {
      // 1. Resolve member if provided
      if (memberId && !recipientName) {
        const memberRes = await client.query(
          `SELECT first_name, last_name, email FROM members WHERE id = $1`,
          [memberId]
        );
        if (memberRes.rowCount > 0) {
          recipientName = `${memberRes.rows[0].first_name} ${memberRes.rows[0].last_name}`.trim();
          if (!recipientEmail) recipientEmail = memberRes.rows[0].email;
        }
      }

      if (!recipientName) {
        recipientName = 'Club Guest';
      }

      // 2. Compute financial totals
      let calculatedSubtotal = 0;
      const processedItems = [];

      for (const it of items) {
        const qty = parseFloat(it.quantity || 1);
        const unitPrice = parseFloat(it.unitPrice !== undefined ? it.unitPrice : it.unit_price || 0);
        const taxRate = parseFloat(it.taxRate !== undefined ? it.taxRate : it.tax_rate || 0);
        const lineSubtotal = qty * unitPrice;
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        calculatedSubtotal += lineSubtotal;
        processedItems.push({
          description: it.description,
          quantity: qty,
          unitPrice,
          taxRate,
          totalPrice: lineTotal,
          referenceType: it.referenceType || it.reference_type || null,
          referenceId: it.referenceId || it.reference_id || null
        });
      }

      const totalAmount = Math.max(0, (calculatedSubtotal - discountAmount) + taxAmount);
      const invoiceNumber = payload.invoiceNumber || payload.invoice_number || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      // 3. Insert Invoice
      const invoiceInsert = await client.query(
        `INSERT INTO invoices (
          invoice_number, member_id, lead_id, recipient_name, recipient_email,
          invoice_type, issue_date, due_date, subtotal, discount_amount,
          tax_amount, total_amount, paid_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0.00, $13)
        RETURNING *`,
        [
          invoiceNumber,
          memberId,
          leadId,
          recipientName,
          recipientEmail,
          invoiceType,
          issueDate,
          dueDate,
          calculatedSubtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          status
        ]
      );

      const createdInvoice = invoiceInsert.rows[0];

      // 4. Insert Line Items
      const createdItems = [];
      for (const item of processedItems) {
        const itemRes = await client.query(
          `INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price, tax_rate,
            total_price, reference_type, reference_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            createdInvoice.id,
            item.description,
            item.quantity,
            item.unitPrice,
            item.taxRate,
            item.totalPrice,
            item.referenceType,
            item.referenceId
          ]
        );
        createdItems.push(itemRes.rows[0]);
      }

      return formatInvoice(createdInvoice, createdItems, []);
    });
  }

  // ==========================================
  // PAYMENTS
  // ==========================================

  /**
   * Get payments with filters
   */
  async getPayments({
    invoiceId = null,
    memberId = null,
    paymentMethod = null,
    status = null,
    startDate = null,
    endDate = null,
    limit = 50,
    offset = 0
  } = {}) {
    let sql = `
      SELECT p.*, i.invoice_number, 
             COALESCE(m.first_name || ' ' || m.last_name, null) AS member_name
      FROM payments p
      LEFT JOIN invoices i ON i.id = p.invoice_id
      LEFT JOIN members m ON m.id = p.member_id
      WHERE 1=1
    `;
    const params = [];

    if (invoiceId) {
      params.push(invoiceId);
      sql += ` AND p.invoice_id = $${params.length}`;
    }

    if (memberId) {
      params.push(memberId);
      sql += ` AND p.member_id = $${params.length}`;
    }

    if (paymentMethod) {
      params.push(paymentMethod.toLowerCase());
      sql += ` AND p.payment_method = $${params.length}`;
    }

    if (status) {
      params.push(status.toLowerCase());
      sql += ` AND p.status = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND p.paid_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND p.paid_at <= $${params.length}`;
    }

    sql += ` ORDER BY p.paid_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows.map(formatPayment);
  }

  /**
   * Record a payment (supports cash, card, UPI, netbanking, wallet, cheque)
   * Updates linked invoice status and paid_amount transactionally if invoiceId is provided
   */
  async createPayment(payload = {}) {
    const invoiceId = payload.invoiceId || payload.invoice_id || null;
    let memberId = payload.memberId || payload.member_id || null;
    const amount = parseFloat(payload.amount);
    const paymentMethod = (payload.paymentMethod || payload.payment_method || 'cash').toLowerCase().trim();
    const transactionReference = payload.transactionReference || payload.transaction_reference || `TXN-${Date.now().toString().slice(-8)}`;
    const status = (payload.status || 'completed').toLowerCase().trim();
    const paidAt = payload.paidAt || payload.paid_at || new Date().toISOString();
    const notes = payload.notes || null;
    const paymentNumber = payload.paymentNumber || payload.payment_number || `PAY-${Date.now().toString().slice(-8)}`;

    return withTransaction(async (client) => {
      let linkedInvoice = null;

      if (invoiceId) {
        // Lock invoice row for update
        const invRes = await client.query(
          `SELECT * FROM invoices WHERE id = $1 FOR UPDATE`,
          [invoiceId]
        );

        if (invRes.rowCount === 0) {
          const error = new Error(`Invoice '${invoiceId}' not found`);
          error.statusCode = 404;
          throw error;
        }

        linkedInvoice = invRes.rows[0];
        if (!memberId && linkedInvoice.member_id) {
          memberId = linkedInvoice.member_id;
        }

        // Only update invoice status and paid_amount if payment is completed
        if (status === 'completed') {
          const currentPaid = parseFloat(linkedInvoice.paid_amount || 0);
          const totalAmount = parseFloat(linkedInvoice.total_amount || 0);
          const newPaid = currentPaid + amount;
          
          let newStatus = 'partially_paid';
          if (newPaid >= totalAmount) {
            newStatus = 'paid';
          } else if (newPaid <= 0) {
            newStatus = 'unpaid';
          }

          await client.query(
            `UPDATE invoices 
             SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [newPaid, newStatus, invoiceId]
          );
        }
      }

      // Insert Payment
      const paymentRes = await client.query(
        `INSERT INTO payments (
          payment_number, invoice_id, member_id, amount, payment_method,
          transaction_reference, status, paid_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          paymentNumber,
          invoiceId,
          memberId,
          amount,
          paymentMethod,
          transactionReference,
          status,
          paidAt,
          notes
        ]
      );

      return formatPayment(paymentRes.rows[0]);
    });
  }

  // ==========================================
  // EXPENSES
  // ==========================================

  /**
   * Get expenses with filters
   */
  async getExpenses({
    category = null,
    paymentMethod = null,
    startDate = null,
    endDate = null,
    limit = 50,
    offset = 0
  } = {}) {
    let sql = `
      SELECT e.*, u.first_name || ' ' || u.last_name AS approved_by_name
      FROM expenses e
      LEFT JOIN users u ON u.id = e.approved_by
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category.toLowerCase());
      sql += ` AND e.category = $${params.length}`;
    }

    if (paymentMethod) {
      params.push(paymentMethod.toLowerCase());
      sql += ` AND e.payment_method = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND e.expense_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND e.expense_date <= $${params.length}`;
    }

    sql += ` ORDER BY e.expense_date DESC, e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows.map(formatExpense);
  }

  /**
   * Record a new expense
   */
  async createExpense(payload = {}) {
    const title = (payload.title || '').trim();
    const amount = parseFloat(payload.amount);
    const category = (payload.category || 'misc').toLowerCase().trim();
    const expenseDate = payload.expenseDate || payload.expense_date || new Date().toISOString().split('T')[0];
    const vendorName = payload.vendorName || payload.vendor_name || null;
    const receiptUrl = payload.receiptUrl || payload.receipt_url || null;
    const paymentMethod = (payload.paymentMethod || payload.payment_method || 'bank_transfer').toLowerCase().trim();
    const approvedBy = payload.approvedBy || payload.approved_by || null;
    const notes = payload.notes || null;
    const expenseNumber = payload.expenseNumber || payload.expense_number || `EXP-${Date.now().toString().slice(-8)}`;

    const res = await query(
      `INSERT INTO expenses (
        expense_number, category, title, amount, expense_date,
        vendor_name, receipt_url, payment_method, approved_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        expenseNumber,
        category,
        title,
        amount,
        expenseDate,
        vendorName,
        receiptUrl,
        paymentMethod,
        approvedBy,
        notes
      ]
    );

    return formatExpense(res.rows[0]);
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId, status, notes = null) {
    const normalizedStatus = (status || '').toLowerCase().trim();
    const validStatuses = ['draft', 'unpaid', 'partially_paid', 'paid', 'void', 'overdue'];
    if (!validStatuses.includes(normalizedStatus)) {
      const error = new Error(`Invalid status '${status}'. Allowed: ${validStatuses.join(', ')}`);
      error.statusCode = 422;
      throw error;
    }

    const res = await query(
      `UPDATE invoices 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id::text = $2 OR invoice_number = $2
       RETURNING *`,
      [normalizedStatus, invoiceId]
    );

    if (res.rowCount === 0) {
      const error = new Error(`Invoice '${invoiceId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return formatInvoice(res.rows[0]);
  }

  // ==========================================
  // OWNER EXECUTIVE MONTH-END & REALTIME HUB
  // ==========================================

  /**
   * Consolidated Owner View: How much did we earn, from where, and what do we owe?
   */
  async getOwnerSummary(period = 'month') {
    const periodNormalized = ['today', 'week', 'month'].includes(period) ? period : 'month';
    const periodFilter = (col) => {
      if (periodNormalized === 'today') return `${col} >= CURRENT_DATE`;
      if (periodNormalized === 'week') return `${col} >= CURRENT_DATE - INTERVAL '7 days'`;
      return `${col} >= CURRENT_DATE - INTERVAL '30 days'`;
    };

    const round2 = (val) => Math.round((Number(val) || 0) * 100) / 100;

    const [
      courtRes,
      shopRes,
      barRes,
      memRes,
      corpInvRes,
      expensesRes,
      expCatRes,
      paymentsMethodRes,
      duesRes,
      employeesRes,
      payrollRes,
      leavesRes,
      taxRes
    ] = await Promise.all([
      // 1. Courts Revenue
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COUNT(id) AS count,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_total,
          COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0) AS unpaid_total
        FROM bookings
        WHERE status NOT IN ('cancelled', 'no_show')
          AND ${periodFilter('created_at')}
      `),

      // 2. Shop Revenue
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COALESCE(SUM(subtotal), 0) AS subtotal,
          COALESCE(SUM(tax_amount), 0) AS tax,
          COALESCE(SUM(discount_amount), 0) AS discount,
          COUNT(id) AS count
        FROM shop_orders
        WHERE status NOT IN ('cancelled', 'refunded')
          AND ${periodFilter('created_at')}
      `),

      // 3. Bar Revenue
      query(`
        SELECT 
          COALESCE(SUM(total), 0) AS total,
          COALESCE(SUM(subtotal), 0) AS subtotal,
          COALESCE(SUM(tax), 0) AS tax,
          COALESCE(SUM(discount_amount), 0) AS discount,
          COUNT(id) AS count,
          COALESCE(SUM(CASE WHEN status = 'settled' THEN total ELSE 0 END), 0) AS settled_total,
          COALESCE(SUM(CASE WHEN status = 'open' THEN total ELSE 0 END), 0) AS open_total
        FROM bar_orders
        WHERE status NOT IN ('cancelled', 'voided')
          AND ${periodFilter('created_at')}
      `),

      // 4. Memberships Revenue
      query(`
        SELECT 
          COALESCE(SUM(mp.price), 0) AS total,
          COUNT(ms.id) AS count
        FROM memberships ms
        JOIN membership_plans mp ON mp.id = ms.plan_id
        WHERE ms.status = 'active'
          AND ${periodFilter('ms.created_at')}
      `),

      // 5. Corporate & General Invoices
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COALESCE(SUM(paid_amount), 0) AS paid_total,
          COALESCE(SUM(total_amount - paid_amount), 0) AS outstanding,
          COUNT(id) AS count
        FROM invoices
        WHERE invoice_type IN ('quotation', 'general', 'membership')
          AND ${periodFilter('created_at')}
      `),

      // 6. Total Operating Expenses
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS count
        FROM expenses
        WHERE ${periodFilter('expense_date')}
      `),

      // 7. Expenses by Category
      query(`
        SELECT 
          category,
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS count
        FROM expenses
        WHERE ${periodFilter('expense_date')}
        GROUP BY category
        ORDER BY total DESC
      `),

      // 8. Payment Methods Breakdown (Card, Cash, Online/UPI, etc.)
      query(`
        SELECT 
          payment_method,
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS count
        FROM payments
        WHERE status = 'completed'
          AND ${periodFilter('paid_at')}
        GROUP BY payment_method
        ORDER BY total DESC
      `),

      // 9. Balance Sheet / Receivables & Dues
      query(`
        SELECT 
          (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE status IN ('unpaid', 'partially_paid', 'overdue')) AS unpaid_invoices_total,
          (SELECT COUNT(*) FROM invoices WHERE status IN ('unpaid', 'partially_paid', 'overdue')) AS unpaid_invoices_count,
          (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') AS overdue_invoices_count,
          (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE status = 'overdue') AS overdue_invoices_total,
          (SELECT COALESCE(SUM(total), 0) FROM bar_orders WHERE status = 'open') AS open_bar_tabs_total,
          (SELECT COUNT(*) FROM bar_orders WHERE status = 'open') AS open_bar_tabs_count,
          (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'unpaid' AND status NOT IN ('cancelled', 'no_show')) AS unpaid_bookings_total,
          (SELECT COUNT(*) FROM bookings WHERE payment_status = 'unpaid' AND status NOT IN ('cancelled', 'no_show')) AS unpaid_bookings_count
      `),

      // 10. Employees & Payroll Metrics
      query(`
        SELECT 
          COUNT(*) AS total_employees,
          COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_employees,
          COALESCE(SUM(CASE WHEN status = 'active' THEN salary ELSE 0 END), 0) AS monthly_salary_liability
        FROM employees
      `),

      // 11. Recent Salary Payouts
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) AS total_salaries_paid,
          COUNT(id) AS payout_count
        FROM expenses
        WHERE category = 'salaries'
          AND ${periodFilter('expense_date')}
      `),

      // 12. Pending Leave Requests
      query(`
        SELECT 
          COUNT(*) AS total_pending,
          COUNT(CASE WHEN leave_type = 'annual' THEN 1 END) AS pending_annual,
          COUNT(CASE WHEN leave_type = 'sick' THEN 1 END) AS pending_sick
        FROM leave_requests
        WHERE status = 'pending'
      `),

      // 13. Taxes Summary
      query(`
        SELECT 
          (SELECT COALESCE(SUM(tax_amount), 0) FROM shop_orders WHERE status NOT IN ('cancelled', 'refunded') AND ${periodFilter('created_at')}) AS shop_tax,
          (SELECT COALESCE(SUM(tax), 0) FROM bar_orders WHERE status NOT IN ('cancelled', 'voided') AND ${periodFilter('created_at')}) AS bar_tax,
          (SELECT COALESCE(SUM(tax_amount), 0) FROM invoices WHERE ${periodFilter('created_at')}) AS invoice_tax,
          (SELECT COALESCE(SUM(total_amount * 0.18), 0) FROM bookings WHERE status NOT IN ('cancelled', 'no_show') AND ${periodFilter('created_at')}) AS court_estimated_tax
      `)
    ]);

    // Financial totals
    const courtTotal = parseFloat(courtRes.rows[0].total || 0);
    const shopTotal = parseFloat(shopRes.rows[0].total || 0);
    const barTotal = parseFloat(barRes.rows[0].total || 0);
    const memTotal = parseFloat(memRes.rows[0].total || 0);

    const grossRevenue = courtTotal + shopTotal + barTotal + memTotal;
    const totalExpenses = parseFloat(expensesRes.rows[0].total || 0);
    const netIncome = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? round2((netIncome / grossRevenue) * 100) : 0;

    // Receivables (What is owed to us)
    const duesRow = duesRes.rows[0];
    const unpaidInvoices = parseFloat(duesRow.unpaid_invoices_total || 0);
    const openBarTabs = parseFloat(duesRow.open_bar_tabs_total || 0);
    const unpaidBookings = parseFloat(duesRow.unpaid_bookings_total || 0);
    const totalReceivables = unpaidInvoices + openBarTabs + unpaidBookings;

    // Payables & Liabilities (What we owe)
    const empRow = employeesRes.rows[0];
    const monthlySalaryLiability = parseFloat(empRow.monthly_salary_liability || 0);
    const salariesPaidThisPeriod = parseFloat(payrollRes.rows[0].total_salaries_paid || 0);
    const pendingPayrollLiability = Math.max(0, monthlySalaryLiability - salariesPaidThisPeriod);

    // Taxes
    const taxRow = taxRes.rows[0];
    const shopTax = parseFloat(taxRow.shop_tax || 0);
    const barTax = parseFloat(taxRow.bar_tax || 0);
    const invoiceTax = parseFloat(taxRow.invoice_tax || 0);
    const courtTax = parseFloat(taxRow.court_estimated_tax || 0);
    const totalOutputTax = shopTax + barTax + invoiceTax + courtTax;
    // Input tax estimate on operating expenses (~12% average)
    const estimatedInputTax = round2(totalExpenses * 0.10);
    const netTaxPayable = Math.max(0, totalOutputTax - estimatedInputTax);

    const totalLiabilities = pendingPayrollLiability + netTaxPayable + totalExpenses;

    // Payment methods map
    const paymentMethodsMap = {
      card: { total: 0, count: 0 },
      cash: { total: 0, count: 0 },
      upi: { total: 0, count: 0 },
      netbanking: { total: 0, count: 0 },
      wallet: { total: 0, count: 0 },
      cheque: { total: 0, count: 0 }
    };

    let totalRecordedPayments = 0;
    for (const row of paymentsMethodRes.rows) {
      const method = (row.payment_method || 'other').toLowerCase();
      const amt = parseFloat(row.total || 0);
      const cnt = parseInt(row.count || 0, 10);
      totalRecordedPayments += amt;
      if (paymentMethodsMap[method]) {
        paymentMethodsMap[method].total += amt;
        paymentMethodsMap[method].count += cnt;
      } else {
        paymentMethodsMap.card.total += amt;
        paymentMethodsMap.card.count += cnt;
      }
    }

    return {
      period: periodNormalized,
      overview: {
        grossRevenue: round2(grossRevenue),
        totalExpenses: round2(totalExpenses),
        netIncome: round2(netIncome),
        profitMargin: profitMargin,
        totalReceivables: round2(totalReceivables),
        totalPayables: round2(totalLiabilities),
        totalRecordedPayments: round2(totalRecordedPayments)
      },
      revenueBySource: [
        {
          source: 'courts',
          label: 'Court Bookings & Coaching',
          amount: round2(courtTotal),
          count: parseInt(courtRes.rows[0].count || 0, 10),
          paidAmount: round2(courtRes.rows[0].paid_total || 0),
          unpaidAmount: round2(courtRes.rows[0].unpaid_total || 0),
          percentage: grossRevenue > 0 ? round2((courtTotal / grossRevenue) * 100) : 0
        },
        {
          source: 'shop',
          label: 'Pro Shop & Equipment Sales',
          amount: round2(shopTotal),
          count: parseInt(shopRes.rows[0].count || 0, 10),
          percentage: grossRevenue > 0 ? round2((shopTotal / grossRevenue) * 100) : 0
        },
        {
          source: 'bar',
          label: 'Sports Bar & Lounge Dining',
          amount: round2(barTotal),
          count: parseInt(barRes.rows[0].count || 0, 10),
          settledAmount: round2(barRes.rows[0].settled_total || 0),
          openTabsAmount: round2(barRes.rows[0].open_total || 0),
          percentage: grossRevenue > 0 ? round2((barTotal / grossRevenue) * 100) : 0
        },
        {
          source: 'memberships',
          label: 'Membership Subscriptions',
          amount: round2(memTotal),
          count: parseInt(memRes.rows[0].count || 0, 10),
          percentage: grossRevenue > 0 ? round2((memTotal / grossRevenue) * 100) : 0
        }
      ],
      paymentChannels: [
        {
          method: 'card',
          label: 'Credit / Debit Card (POS)',
          amount: round2(paymentMethodsMap.card.total),
          count: paymentMethodsMap.card.count,
          percentage: totalRecordedPayments > 0 ? round2((paymentMethodsMap.card.total / totalRecordedPayments) * 100) : 0
        },
        {
          method: 'cash',
          label: 'Cash (Counter / Registers)',
          amount: round2(paymentMethodsMap.cash.total),
          count: paymentMethodsMap.cash.count,
          percentage: totalRecordedPayments > 0 ? round2((paymentMethodsMap.cash.total / totalRecordedPayments) * 100) : 0
        },
        {
          method: 'upi',
          label: 'UPI & Instant Digital Pay',
          amount: round2(paymentMethodsMap.upi.total),
          count: paymentMethodsMap.upi.count,
          percentage: totalRecordedPayments > 0 ? round2((paymentMethodsMap.upi.total / totalRecordedPayments) * 100) : 0
        },
        {
          method: 'netbanking',
          label: 'Net Banking & Wire Transfer',
          amount: round2(paymentMethodsMap.netbanking.total),
          count: paymentMethodsMap.netbanking.count,
          percentage: totalRecordedPayments > 0 ? round2((paymentMethodsMap.netbanking.total / totalRecordedPayments) * 100) : 0
        }
      ],
      receivables: {
        total: round2(totalReceivables),
        unpaidInvoices: {
          amount: round2(unpaidInvoices),
          count: parseInt(duesRow.unpaid_invoices_count || 0, 10),
          overdueAmount: round2(duesRow.overdue_invoices_total || 0),
          overdueCount: parseInt(duesRow.overdue_invoices_count || 0, 10)
        },
        openBarTabs: {
          amount: round2(openBarTabs),
          count: parseInt(duesRow.open_bar_tabs_count || 0, 10)
        },
        unpaidBookings: {
          amount: round2(unpaidBookings),
          count: parseInt(duesRow.unpaid_bookings_count || 0, 10)
        }
      },
      payablesAndLiabilities: {
        total: round2(totalLiabilities),
        pendingPayroll: round2(pendingPayrollLiability),
        monthlySalaryLiability: round2(monthlySalaryLiability),
        salariesPaidThisPeriod: round2(salariesPaidThisPeriod),
        netTaxPayable: round2(netTaxPayable),
        operatingExpenses: round2(totalExpenses)
      },
      expensesByCategory: expCatRes.rows.map(r => ({
        category: r.category,
        amount: round2(r.total),
        count: parseInt(r.count || 0, 10)
      })),
      taxes: {
        totalOutputTax: round2(totalOutputTax),
        estimatedInputTax: round2(estimatedInputTax),
        netTaxPayable: round2(netTaxPayable),
        breakdown: {
          courtEstimatedTax: round2(courtTax),
          shopTax: round2(shopTax),
          barTax: round2(barTax),
          invoiceTax: round2(invoiceTax)
        }
      },
      payroll: {
        activeEmployees: parseInt(empRow.active_employees || 0, 10),
        totalEmployees: parseInt(empRow.total_employees || 0, 10),
        monthlyBaseLiability: round2(monthlySalaryLiability),
        paidThisMonth: round2(salariesPaidThisPeriod),
        pendingDisbursement: round2(pendingPayrollLiability)
      },
      pendingActions: {
        pendingLeaves: parseInt(leavesRes.rows[0].total_pending || 0, 10),
        overdueInvoices: parseInt(duesRow.overdue_invoices_count || 0, 10),
        openBarTabs: parseInt(duesRow.open_bar_tabs_count || 0, 10)
      }
    };
  }

  /**
   * Tax Report for Period
   */
  async getTaxReport(period = 'month') {
    const summary = await this.getOwnerSummary(period);
    return {
      period: summary.period,
      taxes: summary.taxes,
      grossRevenue: summary.overview.grossRevenue,
      totalExpenses: summary.overview.totalExpenses
    };
  }

  /**
   * Payroll Summary & Department Wage Calculator
   */
  async getPayrollSummary(period = 'month') {
    const [employeesRes, deptRes, shiftsRes, recentPayoutsRes] = await Promise.all([
      query(`
        SELECT id, employee_number, first_name, last_name, email, department,
               designation, hourly_rate, salary, employment_type, status, joined_date
        FROM employees
        ORDER BY department ASC, first_name ASC
      `),
      query(`
        SELECT 
          department,
          COUNT(id) AS headcount,
          COALESCE(SUM(salary), 0) AS total_salary,
          COALESCE(AVG(hourly_rate), 0) AS avg_hourly_rate
        FROM employees
        WHERE status = 'active'
        GROUP BY department
        ORDER BY total_salary DESC
      `),
      query(`
        SELECT 
          s.employee_id,
          COUNT(s.id) AS shifts_count,
          COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600), 0) AS total_hours
        FROM staff_shifts s
        WHERE s.shift_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY s.employee_id
      `),
      query(`
        SELECT id, expense_number, title, amount, expense_date, payment_method, notes
        FROM expenses
        WHERE category = 'salaries'
        ORDER BY expense_date DESC
        LIMIT 10
      `)
    ]);

    const shiftHoursMap = {};
    shiftsRes.rows.forEach(r => {
      shiftHoursMap[r.employee_id] = parseFloat(r.total_hours || 0);
    });

    const employeesWithCalculations = employeesRes.rows.map(e => {
      const baseSalary = parseFloat(e.salary || 0);
      const hourlyRate = parseFloat(e.hourly_rate || 0);
      const hoursWorked = shiftHoursMap[e.id] || 0;
      const hourlyWages = hourlyRate * hoursWorked;
      const totalEstimatedPay = baseSalary > 0 ? baseSalary : hourlyWages;

      return {
        id: e.id,
        employeeNumber: e.employee_number,
        name: `${e.first_name} ${e.last_name}`,
        email: e.email,
        department: e.department,
        designation: e.designation,
        employmentType: e.employment_type,
        status: e.status,
        baseSalary,
        hourlyRate,
        hoursWorked: Math.round(hoursWorked * 10) / 10,
        hourlyWages: Math.round(hourlyWages * 100) / 100,
        totalPayable: Math.round(totalEstimatedPay * 100) / 100
      };
    });

    const totalGrossPayroll = employeesWithCalculations
      .filter(e => e.status === 'active')
      .reduce((acc, curr) => acc + curr.totalPayable, 0);

    return {
      period,
      totalHeadcount: employeesRes.rowCount,
      activeHeadcount: employeesRes.rows.filter(e => e.status === 'active').length,
      totalGrossPayroll: Math.round(totalGrossPayroll * 100) / 100,
      departments: deptRes.rows.map(d => ({
        department: d.department,
        headcount: parseInt(d.headcount, 10),
        totalSalary: parseFloat(d.total_salary || 0),
        avgHourlyRate: Math.round(parseFloat(d.avg_hourly_rate || 0) * 100) / 100
      })),
      employees: employeesWithCalculations,
      recentPayouts: recentPayoutsRes.rows.map(formatExpense)
    };
  }

  /**
   * Disburse Staff Payroll and record linked expense
   */
  async disbursePayroll(payload = {}) {
    const department = payload.department || 'all';
    const paymentMethod = (payload.paymentMethod || 'bank_transfer').toLowerCase();
    const approvedBy = payload.approvedBy || null;
    const periodName = payload.periodName || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Calculate sum for target department
    let sql = `SELECT COALESCE(SUM(salary), 0) AS total, COUNT(id) AS count FROM employees WHERE status = 'active'`;
    const params = [];
    if (department !== 'all') {
      params.push(department.toLowerCase());
      sql += ` AND LOWER(department) = $1`;
    }

    const calcRes = await query(sql, params);
    const amount = parseFloat(payload.amount || calcRes.rows[0].total || 0);

    if (amount <= 0) {
      const error = new Error('No payroll amount found to disburse');
      error.statusCode = 422;
      throw error;
    }

    const title = `Staff Payroll Payout - ${department === 'all' ? 'All Departments' : department.toUpperCase()} (${periodName})`;
    const notes = payload.notes || `Disbursement for ${calcRes.rows[0].count} active staff members in ${department} department.`;

    const expense = await this.createExpense({
      title,
      amount,
      category: 'salaries',
      expenseDate: new Date().toISOString().split('T')[0],
      vendorName: `Champions Club Staff (${department})`,
      paymentMethod,
      approvedBy,
      notes
    });

    return {
      success: true,
      message: `Payroll disbursed successfully for ${periodName}`,
      disbursedAmount: amount,
      expense
    };
  }
}

module.exports = new FinanceService();

