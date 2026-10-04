import React, { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShoppingBag, 
  Wine, 
  Calendar, 
  Crown, 
  Scale, 
  Sparkles 
} from 'lucide-react';
import { getTaxReport } from '../../features/management/managementApi.js';
import { formatCurrency } from '../../features/management/managementValidation.js';

export default function TaxReportingSection({ period = 'month', periodLabel = 'This Month' }) {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTax = async () => {
      setLoading(true);
      try {
        const data = await getTaxReport(period);
        setTaxData(data);
      } catch (err) {
        console.error('Failed to load tax report:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTax();
  }, [period]);

  const taxes = taxData?.taxes || {};
  const breakdown = taxes.breakdown || {};
  const outputTax = taxes.totalOutputTax || 0;
  const inputCredit = taxes.estimatedInputTax || 0;
  const netTaxPayable = taxes.netTaxPayable || Math.max(0, outputTax - inputCredit);

  const handleExportCSV = () => {
    const rows = [
      ['Champions Club - Tax Compliance & Filing Summary', periodLabel],
      ['Generated At', new Date().toISOString()],
      [''],
      ['Tax Stream', 'Amount (INR)'],
      ['Court Bookings Estimated Tax (18% GST)', breakdown.courtEstimatedTax || 0],
      ['Pro Shop Commercial Tax (GST)', breakdown.shopTax || 0],
      ['Sports Bar & Lounge Dining Tax (VAT/GST)', breakdown.barTax || 0],
      ['Client & Member Invoices Tax', breakdown.invoiceTax || 0],
      ['Total Output Tax Collected', outputTax],
      ['Input Tax Credit (Operating Expenses & Inventory)', inputCredit],
      ['Net Tax Payable for Period', netTaxPayable]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `champions_club_tax_report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Tax Compliance & Statutory Filing
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ReceiptText className="w-5 h-5 text-cyan-400" />
            Taxes to Report ({periodLabel})
          </h3>
          <p className="text-xs text-[#ede0c4]/60 mt-0.5">
            Real-time tax engine aggregating GST/VAT across Courts, Pro Shop, Bar, and Corporate Invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#02140e] text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 active:scale-95 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Tax CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#dfc99a] text-[#02140e] hover:bg-[#ebd8ad] active:scale-95 transition flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Tax Statement</span>
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#02140e] border border-cyan-800/40 space-y-1">
          <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider block">
            Total Output Tax Collected
          </span>
          <div className="text-2xl font-black text-white">{formatCurrency(outputTax)}</div>
          <span className="text-[11px] text-[#ede0c4]/50 block">From retail, dining, bookings & invoices</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#02140e] border border-emerald-800/40 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider block">
            Input Tax Credit (ITC)
          </span>
          <div className="text-2xl font-black text-emerald-300">{formatCurrency(inputCredit)}</div>
          <span className="text-[11px] text-[#ede0c4]/50 block">Deductible on vendor & utility bills</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#07261c] to-[#02140e] border border-[#dfc99a]/30 space-y-1">
          <span className="text-[10px] font-bold text-[#dfc99a] uppercase tracking-wider block">
            Net Tax Payable to Remit
          </span>
          <div className="text-2xl font-black text-[#dfc99a]">{formatCurrency(netTaxPayable)}</div>
          <span className="text-[11px] text-emerald-400/80 block font-semibold">Ready for month-end filing</span>
        </div>

      </div>

      {/* Tax Collections Breakdown Table */}
      <div className="p-5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#dfc99a]" />
          Departmental Tax Collection Audit
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-[#031811] border border-[#dfc99a]/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              Pro Shop Sales Tax
            </div>
            <div className="text-lg font-black text-white">{formatCurrency(breakdown.shopTax || 0)}</div>
            <span className="text-[10px] text-[#ede0c4]/50 block">Standard 18% & 12% GST brackets on gear</span>
          </div>

          <div className="p-4 rounded-xl bg-[#031811] border border-[#dfc99a]/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <Wine className="w-4 h-4 text-sky-400" />
              Bar & Dining Tax
            </div>
            <div className="text-lg font-black text-white">{formatCurrency(breakdown.barTax || 0)}</div>
            <span className="text-[10px] text-[#ede0c4]/50 block">5% F&B GST / VAT on lounge orders</span>
          </div>

          <div className="p-4 rounded-xl bg-[#031811] border border-[#dfc99a]/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Court Booking Taxes
            </div>
            <div className="text-lg font-black text-white">{formatCurrency(breakdown.courtEstimatedTax || 0)}</div>
            <span className="text-[10px] text-[#ede0c4]/50 block">18% sports facility rental levy</span>
          </div>

          <div className="p-4 rounded-xl bg-[#031811] border border-[#dfc99a]/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#dfc99a]">
              <FileText className="w-4 h-4 text-[#dfc99a]" />
              Invoices & Corporate Tax
            </div>
            <div className="text-lg font-black text-white">{formatCurrency(breakdown.invoiceTax || 0)}</div>
            <span className="text-[10px] text-[#ede0c4]/50 block">GST on corporate packages & retainers</span>
          </div>

        </div>
      </div>

    </div>
  );
}
