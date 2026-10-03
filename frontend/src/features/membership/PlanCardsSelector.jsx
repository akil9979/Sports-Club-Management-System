import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Award, 
  Check, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  ShoppingBag,
  Coffee,
  Info
} from 'lucide-react';
import { getMembershipPlans } from './membershipApi.js';
import { calculateAge } from './memberValidation.js';

export default function PlanCardsSelector({ 
  selectedPlanId, 
  onSelectPlan, 
  billingCycle = 'monthly', 
  onBillingCycleChange,
  memberDob = '',
  errorMessage = ''
}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembershipPlans();
      setPlans(data || []);
      // If none selected, default to gold or first plan if not already set
      if (!selectedPlanId && data && data.length > 0) {
        onSelectPlan(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError('Could not load membership plans from server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const memberAge = calculateAge(memberDob);

  const getTierIcon = (tier = '') => {
    const t = tier.toLowerCase();
    if (t.includes('gold')) return <Crown className="w-5 h-5 text-[#dfc99a]" />;
    if (t.includes('silver')) return <ShieldCheck className="w-5 h-5 text-slate-300" />;
    return <Award className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Billing Cycle Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#041c14]/90 border border-emerald-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#dfc99a]" />
          <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
            Select Membership Plan & Term
          </span>
        </div>

        {onBillingCycleChange && (
          <div className="flex items-center gap-2 self-end sm:self-auto bg-[#02140e] p-1 rounded-xl border border-emerald-900/60 text-xs">
            <button
              type="button"
              onClick={() => onBillingCycleChange('monthly')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                billingCycle === 'monthly'
                  ? 'btn-champagne font-bold shadow-sm'
                  : 'text-emerald-400/70 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => onBillingCycleChange('annual')}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                billingCycle === 'annual'
                  ? 'btn-champagne font-bold shadow-sm'
                  : 'text-emerald-400/70 hover:text-white'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-[#dfc99a]/20 text-[#dfc99a] px-1.5 py-0.2 rounded font-extrabold border border-[#dfc99a]/30">
                -20%
              </span>
            </button>
          </div>
        )}
      </div>

      {/* General validation error passed from form */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#041c14] border border-emerald-900/40 space-y-3 animate-pulse">
              <div className="h-5 w-24 bg-[#07261c] rounded"></div>
              <div className="h-8 w-32 bg-[#07261c] rounded"></div>
              <div className="h-4 w-full bg-[#07261c] rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-center space-y-2">
          <p className="text-xs text-rose-300">{error}</p>
          <button
            type="button"
            onClick={fetchPlans}
            className="px-3 py-1.5 bg-[#07261c] text-xs font-semibold text-white rounded-lg hover:bg-[#0b3829] border border-emerald-800/60 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading Plans</span>
          </button>
        </div>
      )}

      {/* Plans List */}
      {!loading && !error && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id || selectedPlanId?.toLowerCase() === plan.tier?.toLowerCase();
            const isJunior = plan.tier?.toLowerCase() === 'junior';
            const isOverAgeForJunior = isJunior && memberAge !== null && memberAge >= 18;

            // Display data returned strictly by backend
            const displayPrice = billingCycle === 'annual'
              ? (plan.annualPrice || Math.round(plan.price * 12 * 0.8))
              : plan.price;

            return (
              <div
                key={plan.id}
                onClick={() => onSelectPlan(plan.id)}
                className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#041c14] to-[#02140e] border-[#dfc99a] shadow-xl shadow-[#dfc99a]/10 ring-2 ring-[#dfc99a]/40'
                    : 'bg-[#041c14]/80 border-emerald-900/50 hover:border-emerald-700/60 hover:bg-[#07261c]/80'
                } ${isOverAgeForJunior ? 'opacity-70 border-dashed border-rose-500/40' : ''}`}
              >
                <div>
                  {/* Top Bar with Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#02140e] border border-emerald-900/60 flex items-center justify-center">
                        {getTierIcon(plan.tier)}
                      </div>
                      <div>
                        <h4 className="text-sm font-serif font-bold text-[#fcfaf5] tracking-tight leading-tight">
                          {plan.name}
                        </h4>
                        <span className="text-[10px] text-emerald-400/70 uppercase font-semibold">
                          {plan.tier} Tier
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#dfc99a] to-[#d4b470] border-[#dfc99a] text-[#02140e]'
                        : 'border-emerald-800/80 bg-[#02140e]'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Price returned by backend */}
                  <div className="my-3 p-2.5 rounded-xl bg-[#02140e]/90 border border-emerald-900/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-emerald-400/70 font-semibold">₹</span>
                      <span className="text-2xl font-serif font-extrabold text-[#dfc99a]">
                        {displayPrice?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-emerald-400/70">
                        {billingCycle === 'annual' ? '/yr' : '/mo'}
                      </span>
                    </div>
                  </div>

                  {/* Junior Invalidation Warning */}
                  {isOverAgeForJunior && (
                    <div className="mb-2 p-2 rounded-lg bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-300 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        Age {memberAge} exceeds Junior limit (&lt;18). Choose Silver or Gold.
                      </span>
                    </div>
                  )}

                  {/* Benefit Entitlements */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="line-clamp-1">{plan.courtPrivileges || 'Special court rates'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#dfc99a]">
                      <ShoppingBag className="w-3 h-3 text-[#dfc99a] shrink-0" />
                      <span className="line-clamp-1">{plan.shopDiscount || 'Member store discount'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-teal-300">
                      <Coffee className="w-3 h-3 text-teal-400 shrink-0" />
                      <span className="line-clamp-1">{plan.barDiscount || 'Lounge & Bar discount'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-emerald-900/40 text-[10px] text-emerald-400/70 flex items-center justify-between">
                  <span>Advance window:</span>
                  <span className="font-semibold text-emerald-100">
                    {plan.tier?.toLowerCase() === 'gold' ? '14 Days' : plan.tier?.toLowerCase() === 'silver' ? '7 Days' : '3 Days'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
