import React from 'react';
import { 
  Wine, 
  ShoppingBag, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Receipt, 
  PackageCheck 
} from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

/**
 * ShopBarSummarySection Component
 * Displays real-time operational metrics for the Sports Bar & Pro Shop,
 * including order volumes, revenues, top items, and inventory alerts.
 */
export default function ShopBarSummarySection({ salesData, periodLabel = 'Today' }) {
  if (!salesData) return null;

  const bar = salesData.barSummary || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topItems: []
  };

  const shop = salesData.shopSummary || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topItems: [],
    lowStockAlertsCount: 0
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sports Bar & Lounge Card */}
      <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Wine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Sports Bar & Lounge</h3>
                <p className="text-xs text-[#ede0c4]/60">Food & beverage service performance</p>
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#02140e] text-amber-400 border border-amber-500/30">
              {periodLabel}
            </span>
          </div>

          {/* Bar KPI Sub-row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10">
              <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/60 tracking-wider">Revenue</span>
              <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(bar.totalRevenue)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10">
              <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/60 tracking-wider">Orders</span>
              <p className="text-base font-extrabold text-white mt-0.5">{bar.totalOrders} tabs</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10">
              <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/60 tracking-wider">Avg Check</span>
              <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(bar.avgOrderValue)}</p>
            </div>
          </div>

          {/* Top Selling Bar Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#ede0c4]/80 mb-3">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Top Selling Beverages & Bites
              </span>
              <span className="text-[11px] text-[#ede0c4]/50">Units sold</span>
            </div>

            {bar.topItems && bar.topItems.length > 0 ? (
              <div className="space-y-2.5">
                {bar.topItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-xl bg-[#02140e]/70 border border-[#dfc99a]/10 text-xs hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-slate-200">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">{item.unitsSold} units</span>
                      <span className="text-[10px] text-[#dfc99a]">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#ede0c4]/40 italic py-2">No bar transactions recorded for this period.</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#dfc99a]/10 flex items-center justify-between text-xs text-[#ede0c4]/60">
          <span className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#dfc99a]" />
            Live POS Settlement active
          </span>
          <span className="text-amber-400 font-medium">98.4% Table Turn Efficiency</span>
        </div>
      </div>

      {/* Pro Shop & Equipment Card */}
      <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Pro Shop & Equipment</h3>
                <p className="text-xs text-[#ede0c4]/60">Racket, ball & sports apparel retail</p>
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#02140e] text-purple-400 border border-purple-500/30">
              {periodLabel}
            </span>
          </div>

          {/* Shop KPI Sub-row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10">
              <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/60 tracking-wider">Revenue</span>
              <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(shop.totalRevenue)}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10">
              <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/60 tracking-wider">Orders</span>
              <p className="text-base font-extrabold text-white mt-0.5">{shop.totalOrders} sales</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/10">
              <span className="text-[10px] uppercase font-semibold text-[#ede0c4]/60 tracking-wider">Avg Order</span>
              <p className="text-base font-extrabold text-white mt-0.5">{formatCurrency(shop.avgOrderValue)}</p>
            </div>
          </div>

          {/* Top Selling Shop Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#ede0c4]/80 mb-3">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-purple-400" />
                Top Selling Equipment
              </span>
              <span className="text-[11px] text-[#ede0c4]/50">Units sold</span>
            </div>

            {shop.topItems && shop.topItems.length > 0 ? (
              <div className="space-y-2.5">
                {shop.topItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 rounded-xl bg-[#02140e]/70 border border-[#dfc99a]/10 text-xs hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-slate-200">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">{item.unitsSold} units</span>
                      <span className="text-[10px] text-purple-300">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#ede0c4]/40 italic py-2">No merchandise sales recorded for this period.</p>
            )}
          </div>
        </div>

        {/* Low Stock Warning Banner */}
        <div className="pt-4 border-t border-[#dfc99a]/10 flex items-center justify-between text-xs">
          {shop.lowStockAlertsCount > 0 ? (
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl w-full justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">{shop.lowStockAlertsCount} products below restock threshold</span>
              </div>
              <span className="text-[10px] underline font-bold cursor-pointer">View Inventory</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl w-full">
              <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All inventory tiers optimally stocked</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
