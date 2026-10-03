import React from 'react';
import { 
  PieChart, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  TrendingUp,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

/**
 * RevenueBySourceSection Component
 * Visualizes revenue distribution by department/source and payment tender.
 */
export default function RevenueBySourceSection({ revenueData }) {
  if (!revenueData) return null;

  const sources = revenueData.revenueBySource || [];
  const paymentMethods = revenueData.paymentMethods || revenueData.paymentMethodsBreakdown || [];
  const totalRevenue = revenueData.totalRevenue || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue by Source Card */}
      <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] flex items-center justify-center border border-[#dfc99a]/30">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Revenue by Department</h3>
              <p className="text-xs text-[#ede0c4]/60">Total: {formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#02140e] text-[#dfc99a] border border-[#dfc99a]/20">
            Real Time
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="h-3 w-full bg-[#02140e] rounded-full overflow-hidden flex border border-[#dfc99a]/15">
          {sources.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color || '#dfc99a' }}
              title={`${item.source}: ${item.percentage}% (${formatCurrency(item.amount)})`}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>

        {/* Breakdown List */}
        <div className="space-y-3.5 pt-2">
          {sources.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: item.color || '#dfc99a' }}
                />
                <span className="text-white font-medium">{item.source}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-[#fcfaf5]">{formatCurrency(item.amount)}</span>
                <span className="text-[11px] font-mono text-[#ede0c4]/60 w-10 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Channels Breakdown Card */}
      <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Payment Settlement Tender</h3>
              <p className="text-xs text-[#ede0c4]/60">Reconciliation by transaction method</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#02140e] text-sky-400 border border-sky-500/20">
            Tender Split
          </span>
        </div>

        <div className="space-y-4">
          {paymentMethods.map((pm, idx) => {
            const isUPI = pm.method.toLowerCase().includes('upi');
            const isCard = pm.method.toLowerCase().includes('card');
            const Icon = isUPI ? Smartphone : isCard ? CreditCard : Banknote;
            const iconColor = isUPI ? 'text-emerald-400' : isCard ? 'text-sky-400' : 'text-amber-400';

            return (
              <div key={idx} className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span>{pm.method}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{formatCurrency(pm.amount)}</span>
                    <span className="text-[11px] font-bold text-[#dfc99a] px-2 py-0.5 rounded-full bg-[#041c14] border border-[#dfc99a]/20">
                      {pm.percentage}%
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-[#041c14] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pm.percentage}%` }}
                    className={`h-full rounded-full ${
                      isUPI ? 'bg-emerald-400' : isCard ? 'bg-sky-400' : 'bg-amber-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
