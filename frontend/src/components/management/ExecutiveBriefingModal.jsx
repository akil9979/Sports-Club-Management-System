import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  X, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  CreditCard, 
  Scale, 
  Users, 
  ReceiptText 
} from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

export default function ExecutiveBriefingModal({
  isOpen,
  onClose,
  summary,
  periodLabel = 'This Month'
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !summary) return null;

  const overview = summary.overview || {};
  const grossRevenue = overview.grossRevenue || 0;
  const totalExpenses = overview.totalExpenses || 0;
  const netIncome = overview.netIncome || 0;
  const profitMargin = overview.profitMargin || 0;
  const totalReceivables = overview.totalReceivables || 0;
  const totalPayables = overview.totalPayables || 0;

  const revenueBySource = summary.revenueBySource || [];
  const paymentChannels = summary.paymentChannels || [];
  const taxes = summary.taxes || {};
  const payroll = summary.payroll || {};

  // Formatted Executive Briefing Text for WhatsApp / Email
  const generateBriefingText = () => {
    const lines = [
      `🏆 *THE CHAMPIONS CLUB - EXECUTIVE FINANCIAL BRIEFING*`,
      `📅 *Period:* ${periodLabel} (Generated: ${new Date().toLocaleDateString()})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 *1. EARNINGS & PROFITABILITY:*`,
      `• Gross Revenue: ${formatCurrency(grossRevenue)}`,
      `• Total Operating Expenses: ${formatCurrency(totalExpenses)}`,
      `• Net Income (Profit): ${formatCurrency(netIncome)} (${profitMargin}% margin)`,
      ``,
      `📊 *2. REVENUE BY SOURCE:*`,
      ...revenueBySource.map(s => `• ${s.label}: ${formatCurrency(s.amount)} (${s.percentage}%)`),
      ``,
      `💳 *3. PAYMENT INFLOW (UNIFIED LEDGER):*`,
      ...paymentChannels.map(p => `• ${p.label}: ${formatCurrency(p.amount)} (${p.percentage}%)`),
      ``,
      `⚖️ *4. WHAT DO WE OWE & RECEIVABLES:*`,
      `• Total Receivables (Owed to Club): ${formatCurrency(totalReceivables)}`,
      `• Total Payables & Liabilities: ${formatCurrency(totalPayables)}`,
      `• Pending Staff Payroll: ${formatCurrency(payroll.pendingDisbursement || 0)}`,
      `• Net Tax Payable (GST/VAT): ${formatCurrency(taxes.netTaxPayable || 0)}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_The Champions Club Management System_`
    ];
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    try {
      const text = generateBriefingText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['THE CHAMPIONS CLUB - EXECUTIVE FINANCIAL STATEMENT', periodLabel],
      ['Generated At', new Date().toISOString()],
      [''],
      ['Category', 'Metric', 'Amount (INR)'],
      ['P&L Summary', 'Gross Revenue', grossRevenue],
      ['P&L Summary', 'Total Expenses', totalExpenses],
      ['P&L Summary', 'Net Income', netIncome],
      ['P&L Summary', 'Profit Margin (%)', `${profitMargin}%`],
      [''],
      ['Revenue Sources', '---', '---'],
      ...revenueBySource.map(s => ['Revenue Source', s.label, s.amount]),
      [''],
      ['Payment Channels', '---', '---'],
      ...paymentChannels.map(p => ['Payment Channel', p.label, p.amount]),
      [''],
      ['Balance Sheet', 'Total Receivables', totalReceivables],
      ['Balance Sheet', 'Total Payables', totalPayables],
      ['Balance Sheet', 'Pending Staff Payroll', payroll.pendingDisbursement || 0],
      ['Balance Sheet', 'Net Tax Payable', taxes.netTaxPayable || 0]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `champions_club_executive_summary_${periodLabel.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#031811] border border-[#dfc99a]/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#dfc99a]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfc99a] to-[#c59e4b] text-[#02140e] flex items-center justify-center font-bold shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Share Executive Financial Numbers</h3>
              <p className="text-xs text-[#ede0c4]/60">
                Shareable briefing for Club Owner, Board, Bank, or Accountant ({periodLabel})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#ede0c4]/60 hover:text-white hover:bg-[#dfc99a]/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-[#dfc99a] text-[#02140e] hover:bg-[#ebd8ad] border-[#dfc99a]'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Briefing!' : 'Copy to WhatsApp / Email'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-3 rounded-2xl bg-[#02140e] border border-[#dfc99a]/25 text-white hover:bg-[#dfc99a]/10 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#dfc99a]" />
            <span>Print Executive P&L</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-3 rounded-2xl bg-[#02140e] border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Pack</span>
          </button>
        </div>

        {/* Live Preview of Formatted Briefing */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#dfc99a] uppercase tracking-wider block">
            Live Executive Briefing Preview
          </span>
          <pre className="p-4 rounded-2xl bg-[#01100a] border border-[#dfc99a]/15 text-xs text-[#ede0c4]/90 font-mono whitespace-pre-wrap overflow-x-auto select-all leading-relaxed">
            {generateBriefingText()}
          </pre>
        </div>

      </div>
    </div>
  );
}
