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
  Zap,
  ShoppingBag,
  Coffee,
  Calendar
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
      return <Crown className="w-6 h-6 text-amber-400" />;
    }
    if (t.includes('silver')) {
      return <ShieldCheck className="w-6 h-6 text-slate-300" />;
    }
    return <Award className="w-6 h-6 text-emerald-400" />;
  };

  return (
    <section id="plans-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-slate-950/70 border-t border-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transparent Pricing & Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Membership Built for Serious Play
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Whether you want unlimited championship court time, flexible weekend access, or dedicated junior coaching, 
            The Champions Club has an official tier configured for you.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-medium ${!annualBilling ? 'text-white' : 'text-slate-400'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setAnnualBilling(!annualBilling)}
              className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-800 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              role="switch"
              aria-checked={annualBilling}
              aria-label="Toggle annual or monthly billing"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-emerald-400 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  annualBilling ? 'translate-x-7 bg-emerald-400' : 'translate-x-0 bg-slate-400'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${annualBilling ? 'text-white' : 'text-slate-400'}`}>
                Annual Membership
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
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
                className="glass-panel p-8 rounded-2xl border border-slate-800 relative space-y-6 animate-pulse"
              >
                <div className="h-6 w-24 bg-slate-800 rounded-md"></div>
                <div className="h-10 w-44 bg-slate-800 rounded-md"></div>
                <div className="h-4 w-full bg-slate-800/80 rounded-md"></div>
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                  <div className="h-4 w-5/6 bg-slate-800 rounded"></div>
                  <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
                </div>
                <div className="h-12 w-full bg-slate-800 rounded-xl"></div>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-700/50 text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading Plans</span>
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && plans.length === 0 && (
          <div className="text-center py-12 glass-panel rounded-2xl p-8 max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg">No Plans Available at This Time</h3>
            <p className="text-sm text-slate-400 mt-2">
              Membership subscriptions are being updated. Contact our front desk directly for temporary pass allocation.
            </p>
            <Link
              to="/enquiry"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm"
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
                  className={`glass-panel rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative border ${
                    isGold
                      ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-slate-900/80 to-slate-950 shadow-xl shadow-amber-500/10 scale-105 z-10'
                      : 'border-slate-800/80 hover:border-slate-700 hover:shadow-xl'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                          isGold
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isGold && <Sparkles className="w-3 h-3 text-slate-950" />}
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Tier Name & Icon */}
                    <div className="flex items-center justify-between mt-2 mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{plan.name}</h3>
                        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                          {plan.tier} Tier
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center">
                        {getTierIcon(plan.tier)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      {plan.description}
                    </p>

                    {/* Price Display */}
                    <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-semibold text-slate-400">₹</span>
                        <span className="text-4xl font-extrabold text-white tracking-tight">
                          {priceDisplay.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{periodLabel}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
                        <span>GST included</span>
                        {annualBilling && (
                          <span className="text-emerald-400 font-semibold">2 months free included</span>
                        )}
                      </div>
                    </div>

                    {/* Club Benefit Callouts */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-500/20">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{plan.courtPrivileges || 'Special court rates'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/20 px-3 py-2 rounded-xl border border-amber-500/20">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold">{plan.shopDiscount || 'Member store discount'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-teal-300 bg-teal-950/20 px-3 py-2 rounded-xl border border-teal-500/20">
                        <Coffee className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="font-semibold">{plan.barDiscount || 'Lounge & Cafe privileges'}</span>
                      </div>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Plan Inclusions:
                      </div>
                      {plan.features?.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
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
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        isGold
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02]'
                          : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600'
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
        <div className="mt-12 p-6 rounded-2xl glass-panel border border-slate-800 text-center max-w-3xl mx-auto space-y-2">
          <div className="text-sm font-semibold text-slate-200">
            Non-Members & Walk-ins are always welcome!
          </div>
          <p className="text-xs text-slate-400">
            Standard hourly court rates apply to non-members (₹700 – ₹1,200/hr). 
            Members receive priority 7 to 14 days advance reservations, discounted court rates, 
            and exclusive savings at the Pro Shop & Bar.
          </p>
        </div>
      </div>
    </section>
  );
}
