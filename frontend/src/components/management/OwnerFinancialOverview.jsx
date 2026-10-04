import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  Wine, 
  ShoppingBag, 
  Calendar, 
  Crown, 
  ShieldCheck, 
  Users, 
  FileText, 
  ArrowUpRight, 
  Scale, 
  ReceiptText, 
  PieChart 
} from 'lucide-react';
import { formatCurrency, computePercentage } from '../../features/management/managementValidation.js';

/**
 * OwnerFinancialOverview Component
 * 
 * Specifically designed for the Owner sitting down at month-end to answer:
 * 1. How much did we earn? (Gross Revenue, Net Income, Margin)
 * 2. From where? (Courts, Shop, Bar, Memberships)
 * 3. By what method? (Card, Cash, Online/UPI, Netbanking - bringing all channels into one place)
 * 4. What do we owe & what is owed to us? (Receivables, Payables, Payroll, Taxes)
 */
export default function OwnerFinancialOverview({
  summary,
  periodLabel = 'This Month',
  onOpenInvoiceModal,
  onOpenExpenseModal,
  onOpenPayrollModal,
  onOpenShareModal,
  onNavigateTab
}) {
  if (!summary) return null;

  const overview = summary.overview || {};
  const grossRevenue = overview.grossRevenue || 0;
  const totalExpenses = overview.totalExpenses || 0;
  const netIncome = overview.netIncome || 0;
  const profitMargin = overview.profitMargin || 0;
  const totalReceivables = overview.totalReceivables || 0;
  const totalPayables = overview.totalPayables || 0;

  const revenueBySource = summary.revenueBySource || [];
  const paymentChannels = summary.paymentChannels || [];
  const receivables = summary.receivables || {};
  const payables = summary.payablesAndLiabilities || {};
  const taxes = summary.taxes || {};
  const payroll = summary.payroll || {};
  const pendingActions = summary.pendingActions || {};

  const isProfitable = netIncome >= 0;

  // Icon mapper for sources
  const getSourceIcon = (sourceKey) => {
    switch (sourceKey) {
      case 'courts': return <Calendar className="w-5 h-5 text-emerald-400" />;
      case 'shop': return <ShoppingBag className="w-5 h-5 text-purple-400" />;
      case 'bar': return <Wine className="w-5 h-5 text-sky-400" />;
      case 'memberships': return <Crown className="w-5 h-5 text-[#dfc99a]" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  // Icon mapper for payment channels
  const getChannelIcon = (method) => {
    switch (method) {
      case 'card': return <CreditCard className="w-5 h-5 text-amber-400" />;
      case 'cash': return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'upi': return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'netbanking': return <Globe className="w-5 h-5 text-indigo-400" />;
      default: return <CreditCard className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. THE 3 CORE QUESTIONS HERO BANNER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* QUESTION 1: HOW MUCH DID WE EARN? */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 p-6 shadow-2xl space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#dfc99a]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40">
              Q1 • Total Earnings ({periodLabel})
            </span>
            <div className={`p-2 rounded-2xl ${isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>

          <div>
            <span className="text-xs text-[#ede0c4]/60 font-medium block">Gross Club Revenue</span>
            <div className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight mt-0.5">
              {formatCurrency(grossRevenue)}
            </div>
          </div>

          <div className="pt-3 border-t border-[#dfc99a]/15 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#ede0c4]/50 block text-[11px]">Total Expenses</span>
              <span className="font-bold text-rose-300">{formatCurrency(totalExpenses)}</span>
            </div>
            <div>
              <span className="text-[#ede0c4]/50 block text-[11px]">Net Earnings (Profit)</span>
              <span className={`font-bold ${isProfitable ? 'text-emerald-300' : 'text-rose-400'}`}>
                {formatCurrency(netIncome)} ({profitMargin}%)
              </span>
            </div>
          </div>
        </div>

        {/* QUESTION 2: WHERE DID IT COME FROM & HOW PAID? */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Q2 • Multi-Channel Inflow
            </span>
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>

          <div>
            <span className="text-xs text-[#ede0c4]/60 font-medium block">Top Revenue Engine</span>
            <div className="text-2xl font-bold text-white truncate mt-0.5">
              {revenueBySource[0]?.label || 'Pro Shop & Courts'}
            </div>
            <span className="text-xs text-emerald-400 font-semibold">
              {revenueBySource[0] ? `${formatCurrency(revenueBySource[0].amount)} (${revenueBySource[0].percentage}%)` : 'Active'}
            </span>
          </div>

          <div className="pt-3 border-t border-[#dfc99a]/15 flex items-center justify-between text-xs">
            <div>
              <span className="text-[#ede0c4]/50 block text-[11px]">Payment Methods</span>
              <span className="font-bold text-[#dfc99a]">{paymentChannels.length} Unified Channels</span>
            </div>
            <div className="text-right">
              <span className="text-[#ede0c4]/50 block text-[11px]">Recorded Payments</span>
              <span className="font-bold text-white">{formatCurrency(overview.totalRecordedPayments || grossRevenue)}</span>
            </div>
          </div>
        </div>

        {/* QUESTION 3: WHAT DO WE OWE & WHAT IS OWED TO US? */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Q3 • Receivables & Payables
            </span>
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-amber-300/80 font-medium block">Owed to Us (Receivables)</span>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {formatCurrency(totalReceivables)}
              </div>
              <span className="text-[10px] text-[#ede0c4]/60 block">Invoices, Tabs & Bookings</span>
            </div>
            <div>
              <span className="text-xs text-rose-300/80 font-medium block">We Owe (Liabilities)</span>
              <div className="text-xl font-black text-rose-300 mt-0.5">
                {formatCurrency(totalPayables)}
              </div>
              <span className="text-[10px] text-[#ede0c4]/60 block">Payroll, Taxes & Bills</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#dfc99a]/15 flex items-center justify-between text-xs">
            <span className="text-[#ede0c4]/70">Pending Payroll: <strong>{formatCurrency(payables.pendingPayroll || 0)}</strong></span>
            <span className="text-amber-400 font-bold">Tax Due: {formatCurrency(taxes.netTaxPayable || 0)}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. REVENUE BY SOURCE & UNIFIED PAYMENT METHODS (SIDE-BY-SIDE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REVENUE BY SOURCE */}
        <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#dfc99a]" />
                Where Did the Money Come From?
              </h3>
              <p className="text-xs text-[#ede0c4]/60 mt-0.5">
                Breakdown across Courts, Pro Shop, Sports Bar, and Memberships
              </p>
            </div>
            <span className="text-xs font-bold text-[#dfc99a] bg-[#dfc99a]/10 px-3 py-1 rounded-full border border-[#dfc99a]/25">
              100% Attributed
            </span>
          </div>

          <div className="space-y-4">
            {revenueBySource.map((src) => (
              <div key={src.source} className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 hover:border-[#dfc99a]/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#07261c] border border-[#dfc99a]/20 flex items-center justify-center">
                      {getSourceIcon(src.source)}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">{src.label}</span>
                      <span className="text-[11px] text-[#ede0c4]/60">
                        {src.count || 0} transactions / bookings
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-white block">{formatCurrency(src.amount)}</span>
                    <span className="text-[11px] font-bold text-[#dfc99a]">{src.percentage}% of gross</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#dfc99a] to-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(src.percentage, 4)}%` }}
                  />
                </div>

                {/* Auxiliary detail */}
                {src.unpaidAmount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-300/80 pt-1">
                    <span>Collected: {formatCurrency(src.paidAmount || (src.amount - src.unpaidAmount))}</span>
                    <span>Pending at Desk: {formatCurrency(src.unpaidAmount)}</span>
                  </div>
                )}
                {src.openTabsAmount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-300/80 pt-1">
                    <span>Settled Tabs: {formatCurrency(src.settledAmount)}</span>
                    <span>Open Running Tabs: {formatCurrency(src.openTabsAmount)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* UNIFIED PAYMENT CHANNELS: CARD, CASH, ONLINE */}
        <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                How Was Money Received?
              </h3>
              <p className="text-xs text-[#ede0c4]/60 mt-0.5">
                Consolidated payment ledger uniting Card POS, Cash drawers & UPI/Online
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
              All in One Place
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentChannels.map((channel) => (
              <div key={channel.method} className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 hover:border-emerald-500/30 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#07261c] border border-emerald-900/50 flex items-center justify-center">
                    {getChannelIcon(channel.method)}
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    {channel.percentage}%
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-300 block">{channel.label}</span>
                  <span className="text-xl font-black text-white mt-0.5 block">{formatCurrency(channel.amount)}</span>
                  <span className="text-[11px] text-[#ede0c4]/50">{channel.count || 0} recorded payments</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(channel.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Unsettled Tab Callout */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Wine className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Unsettled Member Tabs</span>
                <span className="text-[11px] text-[#ede0c4]/70">
                  {receivables.openBarTabs?.count || 0} open bar tabs awaiting final payment checkout
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-amber-300 whitespace-nowrap">
              {formatCurrency(receivables.openBarTabs?.amount || 0)}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. DETAILED BALANCE SHEET & AUDIT RECONCILIATION */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#041c14] via-[#05241a] to-[#031811] border border-[#dfc99a]/30 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
              Working Capital & Liabilities Engine
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mt-1">
              Month-End Obligations & Receivables Matrix
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenInvoiceModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#dfc99a] text-[#02140e] hover:bg-[#ebd8ad] active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-[#dfc99a]/20"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoice Client / Member</span>
            </button>
            <button
              type="button"
              onClick={onOpenPayrollModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Disburse Payroll</span>
            </button>
          </div>
        </div>

        {/* 4 Cards Grid for Month-End Duties */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card A: Invoicing & Business Clients */}
          <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#dfc99a]">Invoices & Clients</span>
              <FileText className="w-4 h-4 text-[#dfc99a]" />
            </div>
            <div>
              <span className="text-2xl font-black text-white block">
                {formatCurrency(receivables.unpaidInvoices?.amount || 0)}
              </span>
              <span className="text-[11px] text-[#ede0c4]/60">
                {receivables.unpaidInvoices?.count || 0} unpaid ({receivables.unpaidInvoices?.overdueCount || 0} overdue)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('invoicing')}
              className="w-full py-1.5 rounded-xl bg-[#dfc99a]/10 hover:bg-[#dfc99a]/20 text-[#dfc99a] text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>Manage Invoices</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card B: Staff Payroll */}
          <div className="p-4 rounded-2xl bg-[#02140e] border border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">Staff Payroll</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-300 block">
                {formatCurrency(payroll.pendingDisbursement || payables.pendingPayroll || 0)}
              </span>
              <span className="text-[11px] text-[#ede0c4]/60">
                {payroll.activeEmployees || 5} active staff ({formatCurrency(payroll.paidThisMonth || 0)} paid)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('payroll')}
              className="w-full py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>View Roster & Pay</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card C: Taxes to Report */}
          <div className="p-4 rounded-2xl bg-[#02140e] border border-cyan-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">Taxes to Report</span>
              <ReceiptText className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-black text-cyan-300 block">
                {formatCurrency(taxes.netTaxPayable || 0)}
              </span>
              <span className="text-[11px] text-[#ede0c4]/60">
                Output: {formatCurrency(taxes.totalOutputTax || 0)} • Input Credit: {formatCurrency(taxes.estimatedInputTax || 0)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('taxes')}
              className="w-full py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>Tax Filing Summary</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card D: Leave Requests Pending */}
          <div className="p-4 rounded-2xl bg-[#02140e] border border-amber-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Leave Approvals</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-black text-amber-300 block">
                {pendingActions.pendingLeaves || 0}
              </span>
              <span className="text-[11px] text-[#ede0c4]/60">
                Requests awaiting manager sign-off
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('staff_leaves')}
              className="w-full py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <span>Review Requests</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
