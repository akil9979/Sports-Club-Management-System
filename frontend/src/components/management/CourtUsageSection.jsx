import React from 'react';
import { 
  Activity, 
  Clock, 
  Sun, 
  Layers, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

/**
 * CourtUsageSection Component
 * Displays real court utilization metrics, peak vs off-peak rates, and per-court statistics.
 */
export default function CourtUsageSection({ courtUsageData }) {
  if (!courtUsageData) return null;

  const courts = courtUsageData.courtBreakdown || [];

  return (
    <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Court Utilization & Hours Booked</h3>
            <p className="text-xs text-[#ede0c4]/60">Facility occupancy rate across match slots</p>
          </div>
        </div>

        {/* Global Utilization Pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#02140e] border border-emerald-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white">
              {courtUsageData.overallUtilizationPct}% Overall Utilized
            </span>
          </div>
        </div>
      </div>

      {/* Peak vs Off-Peak Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 space-y-1">
          <span className="text-[11px] text-[#ede0c4]/60 block font-medium">Total Hours Played</span>
          <div className="text-xl font-black text-white">
            {courtUsageData.totalHoursBooked} hrs
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">Active Court Bookings</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 space-y-1">
          <span className="text-[11px] text-[#ede0c4]/60 block font-medium">Peak Hours (5 PM - 9 PM)</span>
          <div className="text-xl font-black text-[#dfc99a]">
            {courtUsageData.peakHoursUtilizationPct}%
          </div>
          <span className="text-[10px] text-[#dfc99a]/80 font-semibold">High Demand Prime Slots</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 space-y-1">
          <span className="text-[11px] text-[#ede0c4]/60 block font-medium">Off-Peak (Morning/Day)</span>
          <div className="text-xl font-black text-sky-400">
            {courtUsageData.offPeakHoursUtilizationPct}%
          </div>
          <span className="text-[10px] text-sky-400/80 font-semibold">Academy & Practice Hours</span>
        </div>
      </div>

      {/* Per-Court Detailed Table / Cards */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-bold text-[#dfc99a] uppercase tracking-wider block">
          Individual Court Performance
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {courts.map((court, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 hover:border-[#dfc99a]/40 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{court.courtName}</h4>
                  <span className="text-[10px] font-semibold text-[#dfc99a] uppercase">{court.type}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  {court.utilizationPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-[#041c14] rounded-full overflow-hidden">
                <div
                  style={{ width: `${court.utilizationPct}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#dfc99a]"
                />
              </div>

              <div className="pt-2 border-t border-[#dfc99a]/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#ede0c4]/60 block">Hours Booked</span>
                  <strong className="text-white">{court.hoursBooked} hrs</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#ede0c4]/60 block">Revenue</span>
                  <strong className="text-[#dfc99a]">{formatCurrency(court.revenue)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
