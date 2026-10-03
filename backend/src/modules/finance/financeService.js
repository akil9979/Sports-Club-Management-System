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
}

module.exports = new FinanceService();
