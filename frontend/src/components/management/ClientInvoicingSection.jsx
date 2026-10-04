import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  User, 
  CreditCard, 
  Printer, 
  Download, 
  Send, 
  X, 
  Check, 
  DollarSign 
} from 'lucide-react';
import { 
  getInvoices, 
  createInvoice, 
  updateInvoiceStatus, 
  createPayment 
} from '../../features/management/managementApi.js';
import { formatCurrency } from '../../features/management/managementValidation.js';

export default function ClientInvoicingSection({ onInvoicesUpdated }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // New Invoice Form State
  const [formData, setFormData] = useState({
    clientType: 'corporate', // 'corporate' | 'member'
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    taxNumber: '', // GSTIN / Tax ID
    invoiceType: 'general', // 'general' | 'membership' | 'booking' | 'quotation'
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    discountAmount: 0,
    items: [
      { description: 'Corporate Sports Facility Retainer', quantity: 1, unitPrice: 25000, taxRate: 18 }
    ],
    notes: 'Payment due within 14 days of invoice date.'
  });

  // Payment Recording State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    transactionReference: '',
    notes: ''
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 18 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, it) => sum + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((sum, it) => {
      const lineSubtotal = Number(it.quantity || 1) * Number(it.unitPrice || 0);
      return sum + ((lineSubtotal * Number(it.taxRate || 0)) / 100);
    }, 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const tax = calculateTax();
    const disc = Number(formData.discountAmount || 0);
    return Math.max(0, sub - disc + tax);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.recipientName.trim()) {
      alert('Please enter a recipient / company name');
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const discountAmount = Number(formData.discountAmount || 0);
      const totalAmount = calculateTotal();

      const payload = {
        recipientName: formData.recipientName.trim(),
        recipientEmail: formData.recipientEmail || null,
        invoiceType: formData.invoiceType,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        items: formData.items.map(it => ({
          description: it.description || 'Service',
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
          taxRate: Number(it.taxRate || 0),
          totalPrice: (Number(it.quantity || 1) * Number(it.unitPrice || 0)) * (1 + Number(it.taxRate || 0) / 100)
        }))
      };

      await createInvoice(payload);
      setIsCreateModalOpen(false);
      setActionSuccess('Invoice issued successfully!');
      await loadInvoices();
      if (onInvoicesUpdated) onInvoicesUpdated();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.message || 'Error issuing invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    setSubmitting(true);
    try {
      const amount = Number(paymentForm.amount || selectedInvoiceForPayment.balanceDue || selectedInvoiceForPayment.totalAmount);
      await createPayment({
        invoiceId: selectedInvoiceForPayment.id,
        amount,
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
        notes: paymentForm.notes
      });

      setSelectedInvoiceForPayment(null);
      setActionSuccess(`Payment of ${formatCurrency(amount)} recorded successfully!`);
      await loadInvoices();
      if (onInvoicesUpdated) onInvoicesUpdated();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.message || 'Error recording payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (inv) => {
    try {
      await updateInvoiceStatus(inv.id, 'paid');
      setActionSuccess(`Invoice #${inv.invoiceNumber} marked as PAID`);
      await loadInvoices();
      if (onInvoicesUpdated) onInvoicesUpdated();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    const isCorp = inv.invoiceType === 'general' || inv.invoiceType === 'quotation';
    const matchType = filterType === 'all' || 
      (filterType === 'corporate' && isCorp) || 
      (filterType === 'member' && !isCorp);
    const matchSearch = (inv.recipientName + ' ' + (inv.invoiceNumber || '') + ' ' + (inv.recipientEmail || ''))
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const totalOutstanding = invoices
    .filter(i => ['unpaid', 'partially_paid', 'overdue'].includes(i.status))
    .reduce((acc, curr) => acc + (Number(curr.balanceDue || curr.totalAmount || 0)), 0);

  const totalCollected = invoices
    .filter(i => i.status === 'paid')
    .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/30">
              Commercial & Member Invoicing
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#dfc99a]" />
            Members & Business Clients Invoicing
          </h3>
          <p className="text-xs text-[#ede0c4]/60 mt-0.5">
            Issue, track, and collect corporate retainer packages, member annual renewals, and tournament arena fees
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#dfc99a] text-[#02140e] hover:bg-[#ebd8ad] active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#dfc99a]/15"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15">
          <span className="text-[10px] font-bold text-[#ede0c4]/50 uppercase tracking-wider block">Total Invoices</span>
          <span className="text-2xl font-black text-white">{invoices.length}</span>
          <span className="text-[11px] text-[#ede0c4]/60 block mt-0.5">Active ledger folios</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/40">
          <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider block">Total Collected</span>
          <span className="text-2xl font-black text-emerald-300">{formatCurrency(totalCollected)}</span>
          <span className="text-[11px] text-emerald-500/70 block mt-0.5">Settled invoices</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#02140e] border border-amber-900/40">
          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider block">Outstanding Receivables</span>
          <span className="text-2xl font-black text-amber-300">{formatCurrency(totalOutstanding)}</span>
          <span className="text-[11px] text-amber-500/70 block mt-0.5">Unpaid & Overdue dues</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#ede0c4]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, invoice number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/15 text-xs text-white placeholder:text-[#ede0c4]/30 focus:border-[#dfc99a] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Client Type Filter */}
          <div className="bg-[#02140e] p-1 rounded-xl border border-[#dfc99a]/15 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'all' ? 'bg-[#dfc99a] text-[#02140e]' : 'text-[#ede0c4]/60 hover:text-white'}`}
            >
              All Clients
            </button>
            <button
              type="button"
              onClick={() => setFilterType('corporate')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${filterType === 'corporate' ? 'bg-[#dfc99a] text-[#02140e]' : 'text-[#ede0c4]/60 hover:text-white'}`}
            >
              <Building2 className="w-3 h-3" />
              <span>Business Clients</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('member')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${filterType === 'member' ? 'bg-[#dfc99a] text-[#02140e]' : 'text-[#ede0c4]/60 hover:text-white'}`}
            >
              <User className="w-3 h-3" />
              <span>Members</span>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/15 text-xs font-semibold text-white focus:border-[#dfc99a] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#dfc99a]/15">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#02140e] border-b border-[#dfc99a]/15 text-[#dfc99a] uppercase tracking-wider font-semibold">
              <th className="p-3.5">Invoice #</th>
              <th className="p-3.5">Recipient / Client</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Dates</th>
              <th className="p-3.5 text-right">Amount</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfc99a]/10 bg-[#031811]/60">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#ede0c4]/40 font-medium">
                  No invoices found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const isPaid = inv.status === 'paid';
                const isOverdue = inv.status === 'overdue';
                const isUnpaid = inv.status === 'unpaid' || inv.status === 'partially_paid';

                return (
                  <tr key={inv.id} className="hover:bg-[#02140e]/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">
                      {inv.invoiceNumber || inv.id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{inv.recipientName}</div>
                      {inv.recipientEmail && (
                        <div className="text-[11px] text-[#ede0c4]/50">{inv.recipientEmail}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/20">
                        {inv.invoiceType || 'general'}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#ede0c4]/70">
                      <div>Issued: {inv.issueDate}</div>
                      <div className={isOverdue ? 'text-rose-400 font-semibold' : ''}>Due: {inv.dueDate}</div>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="font-black text-white">{formatCurrency(inv.totalAmount)}</div>
                      {inv.balanceDue > 0 && (
                        <div className="text-[11px] text-amber-300">Due: {formatCurrency(inv.balanceDue)}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-flex items-center gap-1 ${
                        isPaid 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                          : isOverdue 
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' 
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {isPaid && <CheckCircle2 className="w-3 h-3" />}
                        {isOverdue && <AlertCircle className="w-3 h-3" />}
                        {isUnpaid && <Clock className="w-3 h-3" />}
                        <span>{inv.status}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceForPayment(inv);
                            setPaymentForm({
                              amount: String(inv.balanceDue || inv.totalAmount),
                              paymentMethod: 'bank_transfer',
                              transactionReference: '',
                              notes: ''
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceForPrint(inv)}
                        className="p-1.5 rounded-lg text-[#ede0c4]/60 hover:text-white hover:bg-[#dfc99a]/10 border border-transparent hover:border-[#dfc99a]/20 transition inline-flex items-center"
                        title="Print / View Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW INVOICE */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#031811] border border-[#dfc99a]/30 rounded-3xl w-full max-w-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#dfc99a]/15 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Create Client & Member Invoice</h3>
                <p className="text-xs text-[#ede0c4]/60 mt-0.5">Generate formal GST/VAT compliant invoice</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-[#ede0c4]/60 hover:text-white hover:bg-[#dfc99a]/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              
              {/* Client Type & Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                    Client Classification
                  </label>
                  <select
                    value={formData.clientType}
                    onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                  >
                    <option value="corporate">Business / Corporate Client</option>
                    <option value="member">Club Member / Guest</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                    Invoice Category
                  </label>
                  <select
                    value={formData.invoiceType}
                    onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                  >
                    <option value="general">General / Corporate Event & Sponsorship</option>
                    <option value="membership">Membership Subscription / Renewal</option>
                    <option value="booking">Bulk Court Facility Booking</option>
                    <option value="quotation">Quotation Conversion</option>
                  </select>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                    Recipient / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Corp or Rajiv Sharma"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#dfc99a] uppercase tracking-wider">Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#dfc99a]/15 text-[#dfc99a] hover:bg-[#dfc99a]/25 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#02140e] border border-[#dfc99a]/15 grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Description / Service"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#031811] border border-[#dfc99a]/15 text-white focus:border-[#dfc99a] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#031811] border border-[#dfc99a]/15 text-white focus:border-[#dfc99a] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#031811] border border-[#dfc99a]/15 text-white focus:border-[#dfc99a] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', e.target.value)}
                          className="w-full px-1 py-1.5 rounded-lg bg-[#031811] border border-[#dfc99a]/15 text-white focus:border-[#dfc99a] focus:outline-none"
                        >
                          <option value="0">0% Tax</option>
                          <option value="5">5% GST</option>
                          <option value="12">12% GST</option>
                          <option value="18">18% GST</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation summary */}
              <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 space-y-2 text-xs">
                <div className="flex justify-between text-[#ede0c4]/70">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-[#ede0c4]/70">
                  <span>Tax Amount (GST):</span>
                  <span>{formatCurrency(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#dfc99a]/15">
                  <span>Total Amount Due:</span>
                  <span className="text-[#dfc99a]">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dfc99a]/15">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#ede0c4]/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#dfc99a] text-[#02140e] hover:bg-[#ebd8ad] active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT */}
      {/* ========================================================================= */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#031811] border border-emerald-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#dfc99a]/15 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Record Invoice Payment</h3>
                <p className="text-xs text-emerald-300 mt-0.5">
                  Invoice #{selectedInvoiceForPayment.invoiceNumber} • {selectedInvoiceForPayment.recipientName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="p-2 rounded-xl text-[#ede0c4]/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-sm font-bold text-white focus:border-[#dfc99a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                >
                  <option value="bank_transfer">Bank Wire / Direct Transfer</option>
                  <option value="upi">UPI / Instant Digital</option>
                  <option value="card">Credit / Debit Card (POS)</option>
                  <option value="cash">Cash (Counter)</option>
                  <option value="cheque">Company Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                  Transaction Reference / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9823412 or POS-Auth-88"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dfc99a]/15">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ede0c4]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-400 text-[#02140e] hover:bg-emerald-300 active:scale-95 transition"
                >
                  {submitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INVOICE PRINT / RECEIPT VIEW */}
      {/* ========================================================================= */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#fdfbf7] text-[#02140e] rounded-3xl w-full max-w-2xl p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black font-serif tracking-tight text-[#02140e]">THE CHAMPIONS CLUB</h2>
                <span className="text-[11px] uppercase tracking-widest text-[#8c6b24] font-bold block">Tax Invoice & Billing Folio</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold">#{selectedInvoiceForPrint.invoiceNumber}</span>
                <span className={`block text-[11px] font-bold uppercase ${selectedInvoiceForPrint.status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Status: {selectedInvoiceForPrint.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[10px]">Billed To:</span>
                <div className="font-bold text-sm text-gray-900">{selectedInvoiceForPrint.recipientName}</div>
                <div className="text-gray-600">{selectedInvoiceForPrint.recipientEmail || 'N/A'}</div>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-500 block uppercase text-[10px]">Invoice Details:</span>
                <div>Issue Date: <strong>{selectedInvoiceForPrint.issueDate}</strong></div>
                <div>Due Date: <strong>{selectedInvoiceForPrint.dueDate}</strong></div>
              </div>
            </div>

            {/* Items table */}
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 text-gray-700 font-bold">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(selectedInvoiceForPrint.items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="py-2">{it.description}</td>
                    <td className="py-2 text-center">{it.quantity || 1}</td>
                    <td className="py-2 text-right">{formatCurrency(it.unitPrice || it.totalPrice)}</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(it.totalPrice || it.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-3 flex justify-between text-sm font-bold">
              <span>Total Amount:</span>
              <span className="text-base text-[#8c6b24]">{formatCurrency(selectedInvoiceForPrint.totalAmount)}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#02140e] text-white hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-black"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
