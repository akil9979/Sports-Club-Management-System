import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Award, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  ShoppingBag,
  Coffee,
  Calendar,
  Trophy
} from 'lucide-react';
import { getMembershipPlans } from '../../services/api.js';

export default function MembershipPlansSection({ embedded = false }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [annualBilling, setAnnualBilling] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembershipPlans();
      if (!data || data.length === 0) {
        setPlans([]);
      } else {
        setPlans(data);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Unable to load membership tiers right now. Please verify network or try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const getTierIcon = (tier = '') => {
    const t = tier.toLowerCase();
    if (t.includes('gold')) {
      return <Crown className="w-6 h-6 text-[#dfc99a]" />;
    }
    if (t.includes('silver')) {
      return <ShieldCheck className="w-6 h-6 text-slate-300" />;
    }
    return <Award className="w-6 h-6 text-emerald-400" />;
  };

  return (
    <section id="plans-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-[#02140e]/90 border-t border-[#dfc99a]/15'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-[#dfc99a]" />
            <span>Official Club Membership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Membership Built for Serious Athletes
          </h2>
          <p className="text-[#ede0c4]/80 text-sm sm:text-base leading-relaxed">
            Whether you want unlimited championship court time, priority 14-day advance booking, or dedicated junior coaching clinics, 
            The Champions Club has an official tier configured for you.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-semibold ${!annualBilling ? 'text-[#dfc99a]' : 'text-[#ede0c4]/60'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setAnnualBilling(!annualBilling)}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-[#dfc99a]/30 bg-[#041c14] transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#dfc99a]"
              role="switch"
              aria-checked={annualBilling}
              aria-label="Toggle annual or monthly billing"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] shadow-lg ring-0 transition duration-200 ease-in-out mt-0.5 ${
                  annualBilling ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${annualBilling ? 'text-[#dfc99a]' : 'text-[#ede0c4]/60'}`}>
                Annual Membership
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 animate-pulse">
                Save ~20%
              </span>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="glass-panel p-8 rounded-3xl space-y-6 animate-pulse"
              >
                <div className="h-6 w-24 bg-[#06261b] rounded-md"></div>
                <div className="h-10 w-44 bg-[#06261b] rounded-md"></div>
                <div className="h-4 w-full bg-[#06261b] rounded-md"></div>
                <div className="space-y-3 pt-4 border-t border-[#dfc99a]/10">
                  <div className="h-4 w-3/4 bg-[#06261b] rounded"></div>
                  <div className="h-4 w-5/6 bg-[#06261b] rounded"></div>
                  <div className="h-4 w-2/3 bg-[#06261b] rounded"></div>
                </div>
                <div className="h-12 w-full bg-[#06261b] rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-white font-bold text-lg">Unable to Load Plans</h3>
            <p className="text-sm text-rose-200/80">{error}</p>
            <button
              onClick={fetchPlans}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#041c14] hover:bg-[#07261c] text-rose-300 border border-rose-700/50 text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading Plans</span>
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && plans.length === 0 && (
          <div className="text-center py-12 glass-panel rounded-2xl p-8 max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-[#dfc99a]/40 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg">No Plans Available at This Time</h3>
            <p className="text-sm text-[#ede0c4]/70 mt-2">
              Membership subscriptions are being updated. Contact our front desk directly for temporary pass allocation.
            </p>
            <Link
              to="/enquiry"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-champagne text-xs"
            >
              Contact Front Desk
            </Link>
          </div>
        )}

        {/* PLANS GRID */}
        {!loading && !error && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const isGold = plan.tier?.toLowerCase() === 'gold';
              const priceDisplay = annualBilling 
                ? (plan.annualPrice || Math.round(plan.price * 12 * 0.8))
                : plan.price;
              const periodLabel = annualBilling ? '/ year' : '/ month';

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative border ${
                    isGold
                      ? 'border-[#dfc99a]/70 bg-gradient-to-b from-[#093022] via-[#041c14] to-[#02140e] shadow-2xl shadow-[#dfc99a]/15 scale-105 z-10'
                      : 'glass-panel hover:border-[#dfc99a]/40 hover:shadow-xl'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${
                          isGold
                            ? 'bg-gradient-to-r from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] text-[#02140e]'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isGold && <Sparkles className="w-3.5 h-3.5 text-[#02140e]" />}
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Tier Name & Icon */}
                    <div className="flex items-center justify-between mt-2 mb-4">
                      <div>
                        <h3 className="text-2xl font-extrabold text-white tracking-tight">{plan.name}</h3>
                        <span className="text-xs uppercase tracking-wider font-bold text-[#dfc99a]">
                          {plan.tier} Tier
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#02140e] border border-[#dfc99a]/25 flex items-center justify-center">
                        {getTierIcon(plan.tier)}
                      </div>
                    </div>

                    <p className="text-xs text-[#ede0c4]/80 leading-relaxed mb-6">
                      {plan.description}
                    </p>

                    {/* Price Display */}
                    <div className="mb-6 p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-semibold text-[#dfc99a]">₹</span>
                        <span className="text-4xl font-black text-white tracking-tight">
                          {priceDisplay.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-medium text-[#ede0c4]/70">{periodLabel}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-[#ede0c4]/60 flex items-center justify-between border-t border-[#dfc99a]/15 pt-2">
                        <span>All taxes included</span>
                        {annualBilling && (
                          <span className="text-[#dfc99a] font-bold">2 months free included</span>
                        )}
                      </div>
                    </div>

                    {/* Club Benefit Callouts */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-500/25">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{plan.courtPrivileges || 'Special court rates'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#dfc99a] bg-[#dfc99a]/10 px-3 py-2 rounded-xl border border-[#dfc99a]/25">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#dfc99a] shrink-0" />
                        <span className="font-semibold">{plan.shopDiscount || 'Member store discount'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-teal-300 bg-teal-950/30 px-3 py-2 rounded-xl border border-teal-500/25">
                        <Coffee className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="font-semibold">{plan.barDiscount || 'Lounge & Cafe privileges'}</span>
                      </div>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-2.5 pt-4 border-t border-[#dfc99a]/15">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#dfc99a] mb-2">
                        Plan Entitlements:
                      </div>
                      {plan.features?.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-[#ede0c4]">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/40">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan CTA */}
                  <div className="mt-8 pt-4">
                    <Link
                      to={`/members/register?tier=${plan.tier?.toLowerCase()}&planId=${plan.id}`}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                        isGold
                          ? 'btn-champagne'
                          : 'bg-[#041c14] hover:bg-[#07261c] text-white border border-[#dfc99a]/25 hover:border-[#dfc99a]/60 shadow-md'
                      }`}
                    >
                      <span>Enroll in {plan.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Walk-in vs Member Comparison Footnote */}
        <div className="mt-12 p-6 rounded-2xl glass-panel text-center max-w-3xl mx-auto space-y-2">
          <div className="text-sm font-bold text-[#f4efe4]">
            Non-Members & Walk-in Visitors are always welcome!
          </div>
          <p className="text-xs text-[#ede0c4]/80">
            Standard hourly court rates apply to non-members (₹700 – ₹1,200/hr). 
            Members receive priority 7 to 14 days advance reservations, discounted court rates, 
            and exclusive savings at the Pro Shop & Lounge Bar.
          </p>
        </div>
      </div>
    </section>
  );
}
