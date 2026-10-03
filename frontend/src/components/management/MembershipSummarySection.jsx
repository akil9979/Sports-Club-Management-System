import React from 'react';
import { Crown, Users, UserCheck, ShieldCheck, UserX } from 'lucide-react';
import { formatCurrency } from '../../features/management/managementValidation.js';

/**
 * MembershipSummarySection Component
 * Displays membership tier distribution, renewals, and subscriber health.
 */
export default function MembershipSummarySection({ membershipData }) {
  if (!membershipData) return null;

  const tiers = membershipData.tierDistribution || [];

  return (
    <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] flex items-center justify-center border border-[#dfc99a]/30">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Membership Tier Roster & Subscriptions</h3>
            <p className="text-xs text-[#ede0c4]/60">Total Active Subscriptions: {membershipData.totalActiveMembers}</p>
          </div>
        </div>

        {/* Quick Health Stats */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            +{membershipData.newSignups} New Signups
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
            {membershipData.renewalsCount} Renewals
          </span>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier, idx) => {
          const isGold = tier.tier.toLowerCase().includes('gold');
          const isSilver = tier.tier.toLowerCase().includes('silver');

          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isGold
                  ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#02140e] to-[#041c14] border-[#dfc99a]/40 shadow-lg'
                  : 'bg-[#02140e] border-[#dfc99a]/15'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isGold ? (
                      <Crown className="w-4 h-4 text-[#dfc99a]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <h4 className="text-sm font-bold text-white tracking-tight">{tier.tier}</h4>
                  </div>
                  <span className="text-[11px] text-[#ede0c4]/60 block font-mono">
                    {formatCurrency(tier.monthlyFee)}/mo
                  </span>
                </div>

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#041c14] text-[#dfc99a] border border-[#dfc99a]/20">
                  {tier.badge}
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">{tier.count}</span>
                  <span className="text-xs font-bold text-[#dfc99a]">{tier.percentage}% of Club</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-[#041c14] rounded-full overflow-hidden mt-2">
                  <div
                    style={{ width: `${tier.percentage}%` }}
                    className={`h-full rounded-full ${
                      isGold ? 'bg-[#dfc99a]' : isSilver ? 'bg-emerald-400' : 'bg-sky-400'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#dfc99a]/10 flex items-center justify-between text-[11px] text-[#ede0c4]/70">
                <span>Monthly Volume:</span>
                <strong className="text-white font-mono font-bold">
                  {formatCurrency(tier.count * tier.monthlyFee)}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
