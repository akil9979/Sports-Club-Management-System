import React from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  ShoppingBag, 
  Coffee, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  QrCode
} from 'lucide-react';

export default function ActiveMembershipCard({ 
  membership, 
  onRenewOrChangePlan,
  onRenewClick,
  onViewDigitalPass
}) {
  const handleRenew = onRenewOrChangePlan || onRenewClick;
  if (!membership) {
    return (
      <div className="p-6 rounded-3xl border border-emerald-900/40 bg-[#041c14]/90 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#07261c] border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-[#fcfaf5]">No Active Membership</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#07261c] text-emerald-400 border border-emerald-800/60 uppercase">
                  Walk-In Status
                </span>
              </div>
              <p className="text-xs text-emerald-300/70 mt-0.5">
                Member is currently paying standard walk-in hourly court rates with zero shop or bar discounts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRenewOrChangePlan}
            className="shrink-0 px-4 py-2.5 rounded-xl btn-champagne font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#dfc99a]/15 transition"
          >
            <Sparkles className="w-4 h-4 text-[#02140e]" />
            <span>Assign Membership Plan</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    tier = 'Standard',
    planName = 'Membership',
    price,
    billingCycle = 'monthly',
    startDate,
    endDate,
    courtPrivileges,
    shopDiscount,
    barDiscount,
    benefits = []
  } = membership;

  // Calculate days remaining or days expired
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = diffDays < 0 || membership.status === 'expired';
  const isExpiringSoon = !isExpired && diffDays <= 7;

  const isGold = tier?.toLowerCase() === 'gold';
  const isSilver = tier?.toLowerCase() === 'silver';
  const isJunior = tier?.toLowerCase() === 'junior';

  return (
    <div className={`rounded-3xl p-6 sm:p-8 border relative overflow-hidden transition-all shadow-xl backdrop-blur-md ${
      isExpired
        ? 'bg-rose-950/20 border-rose-800/60 shadow-rose-950/20'
        : isGold
        ? 'bg-gradient-to-br from-[#dfc99a]/15 via-[#041c14] to-[#02140e] border-[#dfc99a]/40 shadow-[#dfc99a]/10'
        : isSilver
        ? 'bg-gradient-to-br from-slate-900/60 via-[#041c14] to-[#02140e] border-slate-700/60 shadow-slate-900/50'
        : 'bg-gradient-to-br from-emerald-950/40 via-[#041c14] to-[#02140e] border-emerald-500/40 shadow-emerald-500/10'
    }`}>
      {/* Top Banner Alert for Expired or Expiring Soon */}
      {isExpired ? (
        <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/80 text-xs text-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="font-bold">Membership Expired: </strong>
              <span>Expired on {endDate} ({Math.abs(diffDays)} days ago). Court, shop, and bar discounts are disabled.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRenewOrChangePlan}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            Renew Plan
          </button>
        </div>
      ) : isExpiringSoon ? (
        <div className="mb-6 p-3.5 rounded-2xl bg-[#dfc99a]/15 border border-[#dfc99a]/80 text-xs text-[#dfc99a] flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#dfc99a] shrink-0" />
            <div>
              <strong className="font-bold">Expiring in {diffDays} {diffDays === 1 ? 'day' : 'days'}: </strong>
              <span>Renew now to maintain uninterrupted 14-day advance slot booking and lounge rates.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRenewOrChangePlan}
            className="shrink-0 px-3.5 py-1.5 rounded-xl btn-champagne font-bold text-xs shadow-md transition"
          >
            Renew Early
          </button>
        </div>
      ) : null}

      {/* Main Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-900/40">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg ${
            isExpired
              ? 'bg-rose-950/40 border-rose-800 text-rose-400'
              : isGold
              ? 'bg-[#dfc99a]/20 border-[#dfc99a]/40 text-[#dfc99a]'
              : isSilver
              ? 'bg-slate-800 border-slate-600 text-slate-300'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}>
            {isGold ? (
              <Crown className="w-8 h-8" />
            ) : isSilver ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <Award className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-extrabold text-[#fcfaf5] tracking-tight">
                {planName}
              </h2>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isExpired
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40'
              }`}>
                {isExpired ? 'Expired' : 'Active Tier'}
              </span>
            </div>
            <div className="text-xs text-emerald-300/70 mt-0.5 flex items-center gap-3">
              <span>{tier} Membership</span>
              <span>•</span>
              <span className="capitalize">{billingCycle} Billing (₹{price?.toLocaleString('en-IN')})</span>
            </div>
          </div>
        </div>

        {/* Actions: View Digital Pass & Renew/Upgrade */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onViewDigitalPass && (
            <button
              type="button"
              onClick={onViewDigitalPass}
              className="px-4 py-2.5 rounded-xl btn-champagne text-[#02140e] text-xs font-bold flex items-center gap-2 shadow-md shadow-[#dfc99a]/15 transition hover:scale-[1.02] active:scale-95"
            >
              <QrCode className="w-4 h-4 text-[#02140e]" />
              <span>Digital QR Pass</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRenew}
            className="px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>{isExpired ? 'Reactivate Plan' : 'Change / Renew Plan'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expiry & Duration Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-emerald-900/40">
        <div className="p-4 rounded-2xl bg-[#02140e]/80 border border-emerald-900/50">
          <span className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider block">
            Start Date
          </span>
          <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{startDate}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#02140e]/80 border border-emerald-900/50">
          <span className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider block">
            Expiry / Renewal Date
          </span>
          <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
            isExpired ? 'text-rose-400' : 'text-[#dfc99a]'
          }`}>
            <Clock className="w-3.5 h-3.5 text-[#dfc99a]" />
            <span>{endDate}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#02140e]/80 border border-emerald-900/50">
          <span className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider block">
            Status & Expiry Countdown
          </span>
          <div className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
            isExpired 
              ? 'text-rose-400' 
              : isExpiringSoon 
              ? 'text-[#dfc99a]' 
              : 'text-emerald-400'
          }`}>
            {isExpired ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isExpired
                ? `Expired (${Math.abs(diffDays)}d ago)`
                : `${diffDays} days remaining`}
            </span>
          </div>
        </div>
      </div>

      {/* Benefit Breakdown Display */}
      <div className="pt-6 space-y-4">
        <h4 className="text-xs font-bold text-emerald-300/80 uppercase tracking-wider">
          Active Member Entitlements & Discounts
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#07261c] border border-emerald-800/60 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Court Bookings
              </span>
              <span className="text-xs font-semibold text-emerald-100">
                {courtPrivileges || 'Standard rates'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#07261c] border border-[#dfc99a]/30 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-[#dfc99a] shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[#dfc99a] uppercase tracking-wider block">
                Pro Shop & Gear
              </span>
              <span className="text-xs font-semibold text-emerald-100">
                {shopDiscount || 'Member discount'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#07261c] border border-teal-800/60 flex items-center gap-3">
            <Coffee className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                Sports Bar & Cafe
              </span>
              <span className="text-xs font-semibold text-emerald-100">
                {barDiscount || 'Tab discounts'}
              </span>
            </div>
          </div>
        </div>

        {benefits.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-emerald-300/70">
            {benefits.slice(0, 4).map((b, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#07261c] border border-emerald-900/60 text-emerald-200">
                ✓ {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
