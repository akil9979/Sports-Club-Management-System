import React from 'react';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

/**
 * UsageIndicator Component
 * Displays the member's daily court play limit status: 0/2, 1/2, or 2/2.
 * Adheres strictly to the club rule: Maximum 2 member plays per day.
 */
export default function UsageIndicator({ usage, member, date }) {
  const usedCount = usage?.usedCount ?? 0;
  const maxDaily = usage?.maxDaily ?? 2;
  const remaining = Math.max(0, maxDaily - usedCount);
  const display = `${Math.min(usedCount, maxDaily)}/${maxDaily}`;

  // State styling
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let barColor = 'bg-emerald-400';
  let message = `${remaining} session${remaining === 1 ? '' : 's'} available today`;
  let isExceeded = usedCount >= maxDaily;

  if (usedCount === 1) {
    badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/35';
    barColor = 'bg-amber-400';
    message = '1 session remaining today';
  } else if (isExceeded) {
    badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/35';
    barColor = 'bg-rose-500';
    message = 'Daily limit reached (Max 2 sessions/day)';
  }

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all ${badgeColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Indicator title and status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#02140e]/60 border border-current/20 flex items-center justify-center shrink-0">
            {isExceeded ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : usedCount === 1 ? (
              <Clock className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#ede0c4]/70 uppercase tracking-wider">
                Member Daily Usage
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#02140e] font-extrabold border border-current/30">
                {display}
              </span>
            </div>
            <div className="text-sm font-bold text-white tracking-tight">
              {message}
            </div>
          </div>
        </div>

        {/* Right: Visual quota progress dots / bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {[1, 2].map((slotIndex) => {
              const filled = usedCount >= slotIndex;
              return (
                <div
                  key={slotIndex}
                  className={`w-8 h-2.5 rounded-full transition-all ${
                    filled ? barColor : 'bg-[#041c14] border border-[#dfc99a]/20'
                  }`}
                  title={`Session ${slotIndex}: ${filled ? 'Used' : 'Available'}`}
                />
              );
            })}
          </div>

          <div className="text-right hidden md:block">
            <span className="text-[11px] text-[#ede0c4]/60 block">Quota Policy</span>
            <span className="text-xs font-semibold text-[#dfc99a]">Max 2 Plays/Day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
