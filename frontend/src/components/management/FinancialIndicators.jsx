import React from 'react';
import { 
  AlertCircle, 
  Clock, 
  Wine, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { formatCurrency, computePercentage } from '../../features/management/managementValidation.js';

/**
 * FinancialIndicators Component
 * Highlights pending receivables, unsettled bar tabs, and uncollected court fees
 * directly supplied by the frozen dashboard summary API.
 */
export default function FinancialIndicators({ financials }) {
  if (!financials) return null;

  const totalOutstanding = financials.totalOutstanding || 0;
  const unsettledTabs = financials.unsettledTabsAmount || 0;
  const unpaidCourts = financials.unpaidCourtHoursAmount || 0;
  const uncollectedCount = financials.uncollectedInvoicesCount || 0;

  const tabsRatio = computePercentage(unsettledTabs, totalOutstanding);
  const courtsRatio = computePercentage(unpaidCourts, totalOutstanding);

  const isHealthy = totalOutstanding === 0;

  return (
    <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
            isHealthy 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Outstanding Financial Indicators
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                isHealthy
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isHealthy ? 'Clear' : 'Pending Audit'}
              </span>
            </h3>
            <p className="text-xs text-[#ede0c4]/60">
              Live aging receivables across member tabs and court post-settlements
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right bg-[#02140e] px-4 py-2.5 rounded-2xl border border-[#dfc99a]/15">
          <span className="text-[10px] font-bold text-[#ede0c4]/60 uppercase tracking-wider block">
            Total Outstanding
          </span>
          <span className={`text-xl font-black ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Unsettled Tabs */}
        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 hover:border-amber-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-300">
              <Wine className="w-4 h-4 text-amber-400" />
              Unsettled Bar Tabs
            </span>
            <span className="text-[11px] font-bold text-amber-400">{tabsRatio}%</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(unsettledTabs)}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${tabsRatio}%` }}
            />
          </div>
          <p className="text-[11px] text-[#ede0c4]/50">
            Open tabs pending end-of-evening member ledger checkout
          </p>
        </div>

        {/* Unpaid Court Hours */}
        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 hover:border-sky-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-300">
              <Calendar className="w-4 h-4 text-sky-400" />
              Unpaid Court Sessions
            </span>
            <span className="text-[11px] font-bold text-sky-400">{courtsRatio}%</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(unpaidCourts)}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-sky-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${courtsRatio}%` }}
            />
          </div>
          <p className="text-[11px] text-[#ede0c4]/50">
            Post-match court lights, equipment rental & non-member guest fees
          </p>
        </div>

        {/* Uncollected Invoices / Tabs Count */}
        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 hover:border-purple-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-semibold text-slate-300">
              <FileText className="w-4 h-4 text-purple-400" />
              Uncollected Folios
            </span>
            <span className="text-[11px] font-bold text-purple-400">Total Count</span>
          </div>
          <div className="text-xl font-bold text-white">
            {uncollectedCount} <span className="text-xs font-normal text-[#ede0c4]/60">invoices</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-purple-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(uncollectedCount * 5, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#ede0c4]/50">
            Folios awaiting automated payment retry or counter settlement
          </p>
        </div>
      </div>
    </div>
  );
}
