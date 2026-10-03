import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Wine, 
  ShoppingBag, 
  AlertCircle,
  Crown,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

/**
 * KPICards Component
 * Displays top-level executive KPIs driven by real API data.
 */
export default function KPICards({ kpis, periodLabel = 'Today' }) {
  if (!kpis) return null;

  const cards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(kpis.totalRevenue),
      subtext: `+${kpis.revenueGrowthPct}% vs previous ${periodLabel.toLowerCase()}`,
      icon: TrendingUp,
      accent: 'text-[#dfc99a]',
      bgAccent: 'bg-[#dfc99a]/10 border-[#dfc99a]/30',
      badge: `${periodLabel} Total`
    },
    {
      id: 'members',
      title: 'Active Members',
      value: kpis.activeMembers.toLocaleString(),
      subtext: `+${kpis.newMembersCount} new signups ${periodLabel.toLowerCase()}`,
      icon: Users,
      accent: 'text-emerald-400',
      bgAccent: 'bg-emerald-500/10 border-emerald-500/30',
      badge: 'Club Roster'
    },
    {
      id: 'courts',
      title: 'Court Bookings',
      value: `${kpis.courtBookingsCount} Sessions`,
      subtext: `${kpis.courtUtilizationPct}% utilization rate`,
      icon: Calendar,
      accent: 'text-sky-400',
      bgAccent: 'bg-sky-500/10 border-sky-500/30',
      badge: `${kpis.courtUtilizationPct}% Utilized`
    },
    {
      id: 'bar_shop',
      title: 'Bar & Shop Sales',
      value: formatCurrency((kpis.barRevenue || 0) + (kpis.shopRevenue || 0)),
      subtext: `${kpis.barOrdersCount || 0} Bar + ${kpis.shopOrdersCount || 0} Shop orders`,
      icon: Wine,
      accent: 'text-purple-400',
      bgAccent: 'bg-purple-500/10 border-purple-500/30',
      badge: 'Retail & POS'
    },
    {
      id: 'outstanding',
      title: 'Outstanding Dues',
      value: formatCurrency(kpis.outstandingDues),
      subtext: 'Unsettled tabs & unpaid court hours',
      icon: AlertCircle,
      accent: kpis.outstandingDues > 0 ? 'text-amber-400' : 'text-emerald-400',
      bgAccent: kpis.outstandingDues > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30',
      badge: 'Receivables'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-[#031811] border border-[#dfc99a]/15 hover:border-[#dfc99a]/40 transition-all flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs text-[#ede0c4]/70 font-semibold uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.bgAccent}`}>
                <Icon className={`w-4 h-4 ${card.accent}`} />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-white tracking-tight">
                {card.value}
              </div>
              <div className="text-[11px] text-[#ede0c4]/60 pt-1 flex items-center gap-1">
                <span>{card.subtext}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#dfc99a]/10 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#02140e] text-[#ede0c4]/80 border border-[#dfc99a]/15">
                {card.badge}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#dfc99a]/40" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
