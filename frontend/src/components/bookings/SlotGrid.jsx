import React, { useState } from 'react';
import { 
  Clock, 
  Users, 
  XCircle, 
  CheckCircle, 
  Crown, 
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';

/**
 * SlotGrid Component
 * Renders the 30-minute start interval, 1-hour duration court slots grid.
 * Clearly differentiates:
 * - Available (ready to select and confirm)
 * - Selected
 * - Booked by Member (unavailable)
 * - Social Play (Club Mixer Session)
 * - Trial Session / Maintenance
 */
export default function SlotGrid({
  slots = [],
  selectedSlot = null,
  onSelectSlot,
  court,
  memberTier = 'Gold',
  dailyLimitReached = false,
  isLoading = false,
  error = null,
  onRetry
}) {
  const [timeFilter, setTimeFilter] = useState('all'); // all | morning | afternoon | evening

  // Filter slots by time of day
  const filteredSlots = slots.filter((slot) => {
    if (timeFilter === 'all') return true;
    const hour = parseInt(slot.startTime.split(':')[0], 10);
    if (timeFilter === 'morning') return hour < 12;
    if (timeFilter === 'afternoon') return hour >= 12 && hour < 17;
    if (timeFilter === 'evening') return hour >= 17;
    return true;
  });

  const isGold = memberTier?.toLowerCase() === 'gold';
  const effectiveRate = isGold ? 0 : (court?.memberRate || court?.hourlyRate || 400);

  return (
    <div className="space-y-6">
      {/* Filter and Protocol Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/15">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#dfc99a]" />
          <span className="text-xs font-bold text-white tracking-wide">
            30-Min Intervals • 1-Hour Match Duration
          </span>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#ede0c4]/60 mr-1 hidden md:inline">Session:</span>
          {[
            { id: 'all', label: 'All (6 AM - 11 PM)' },
            { id: 'morning', label: 'Morning' },
            { id: 'afternoon', label: 'Afternoon' },
            { id: 'evening', label: 'Evening / Prime' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                timeFilter === filter.id
                  ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] font-bold shadow-md shadow-[#dfc99a]/15'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#07261c] border border-transparent'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mandatory Contract Notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-[#ede0c4]/80">
        <Info className="w-4 h-4 text-[#dfc99a] shrink-0" />
        <span>
          <strong className="text-white">Strict Booking Protocol:</strong> Court slots remain tentative until validated & confirmed by the club booking server.
        </span>
      </div>

      {/* Daily limit reached warning if applicable */}
      {dailyLimitReached && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="font-bold block">Daily Session Limit Reached (2/2)</strong>
            <span>You have reached the maximum allowed 2 sessions today. Cancel an existing booking to reserve another slot.</span>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#031811] border border-[#dfc99a]/10 space-y-3 animate-pulse">
              <div className="h-4 w-28 bg-[#07261c] rounded"></div>
              <div className="h-6 w-20 bg-[#07261c] rounded-md"></div>
              <div className="h-9 w-full bg-[#07261c] rounded-xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {!isLoading && error && (
        <div className="p-8 rounded-2xl bg-[#031811] border border-rose-800/40 text-center space-y-4 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h4 className="text-white font-bold text-base">Schedule Unavailable</h4>
          <p className="text-xs text-rose-300">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 rounded-xl text-xs font-bold hover:bg-[#dfc99a]/25"
            >
              Retry Loading Schedule
            </button>
          )}
        </div>
      )}

      {/* EMPTY FILTER STATE */}
      {!isLoading && !error && filteredSlots.length === 0 && (
        <div className="p-10 rounded-2xl bg-[#031811] border border-[#dfc99a]/15 text-center space-y-3 max-w-md mx-auto">
          <Clock className="w-10 h-10 text-[#dfc99a]/40 mx-auto" />
          <h4 className="text-white font-bold text-base">No Matching Sessions</h4>
          <p className="text-xs text-[#ede0c4]/70">
            No court sessions found for this filter. Try selecting "All Sessions".
          </p>
          <button
            onClick={() => setTimeFilter('all')}
            className="px-4 py-2 bg-[#041c14] text-[#dfc99a] border border-[#dfc99a]/30 rounded-xl text-xs font-semibold hover:bg-[#07261c]"
          >
            Show All Sessions
          </button>
        </div>
      )}

      {/* SLOTS GRID */}
      {!isLoading && !error && filteredSlots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSlots.map((slot) => {
            const isAvailable = slot.available;
            const isSelected = selectedSlot?.id === slot.id;
            const isSocial = slot.status?.toLowerCase().includes('social');
            const isTrial = slot.status?.toLowerCase().includes('trial');

            return (
              <div
                key={slot.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#dfc99a]/20 via-[#031811] to-[#02140e] border-[#dfc99a] shadow-lg shadow-[#dfc99a]/15 ring-2 ring-[#dfc99a]/50'
                    : isAvailable
                    ? 'bg-[#031811]/90 border-emerald-500/25 hover:border-[#dfc99a]/60 hover:shadow-md hover:shadow-emerald-500/10'
                    : isSocial
                    ? 'bg-[#dfc99a]/5 border-[#dfc99a]/30'
                    : 'bg-[#02140e]/60 border-[#dfc99a]/10 opacity-60'
                }`}
              >
                {/* Slot Header: Time & Badges */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${isAvailable ? 'text-emerald-400' : 'text-[#ede0c4]/40'}`} />
                      <span className="text-sm font-bold text-white tracking-tight">
                        {slot.timeLabel}
                      </span>
                    </div>

                    {slot.isPrime && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/35 uppercase tracking-wider">
                        Prime
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#ede0c4]/60">
                    Duration: <strong className="text-[#f4efe4]">1 Hour</strong>
                  </div>
                </div>

                {/* Status & Pricing */}
                <div className="mb-4 pt-2 border-t border-[#dfc99a]/10">
                  {isAvailable ? (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Available
                      </span>

                      {/* Pricing Tier Display */}
                      <div className="text-right">
                        {isGold ? (
                          <span className="text-xs font-black text-[#dfc99a] flex items-center gap-1">
                            <Crown className="w-3 h-3 text-[#dfc99a]" />
                            <span>100% INCLUDED</span>
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-white">₹{effectiveRate}</span>
                            <span className="text-[9px] text-[#ede0c4]/60">Member Rate</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isSocial ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-[#dfc99a]">
                        <Users className="w-3.5 h-3.5" />
                        <span>Club Social Mixer</span>
                      </span>
                      <span className="text-[10px] text-[#ede0c4]/60">Open Play</span>
                    </div>
                  ) : isTrial ? (
                    <div className="flex items-center justify-between text-xs text-sky-400">
                      <span className="font-semibold">Trial Assessment</span>
                      <span className="text-[10px] text-[#ede0c4]/60">Coach Assigned</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-[#ede0c4]/45">
                      <span className="flex items-center gap-1.5 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Booked by Member</span>
                      </span>
                      <span className="text-[10px]">Unavailable</span>
                    </div>
                  )}
                </div>

                {/* Slot Action Button */}
                <div>
                  {isAvailable ? (
                    <button
                      type="button"
                      disabled={dailyLimitReached}
                      onClick={() => onSelectSlot(slot)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/30'
                          : dailyLimitReached
                          ? 'bg-[#041c14] text-[#ede0c4]/40 border border-[#dfc99a]/10 cursor-not-allowed'
                          : 'bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 hover:bg-gradient-to-r hover:from-[#f7f1e3] hover:to-[#dfc99a] hover:text-[#02140e]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Selected Session</span>
                        </>
                      ) : dailyLimitReached ? (
                        <span>Limit Reached</span>
                      ) : (
                        <>
                          <span>Reserve Slot</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : isSocial ? (
                    <div className="w-full py-2 px-3 text-center text-xs font-semibold text-[#dfc99a] bg-[#dfc99a]/10 rounded-xl border border-[#dfc99a]/20">
                      Mixer Ongoing
                    </div>
                  ) : (
                    <div className="w-full py-2 px-3 text-center text-xs font-medium text-[#ede0c4]/40 bg-[#02140e] rounded-xl border border-transparent cursor-not-allowed">
                      Unavailable
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
