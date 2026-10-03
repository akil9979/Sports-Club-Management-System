import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Crown, 
  Loader2,
  Trophy,
  ArrowRight,
  FileText
} from 'lucide-react';
import { createBooking } from '../../features/bookings/bookingApi.js';

/**
 * BookingSummaryModal Component
 * Handles booking review, dynamic pricing calculation, server verification,
 * authoritative conflict error display, and confirmed booking receipt.
 */
export default function BookingSummaryModal({
  isOpen,
  onClose,
  court,
  date,
  slot,
  member,
  dailyUsage,
  onBookingSuccess
}) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  if (!isOpen || !court || !slot) return null;

  const memberTier = member?.activeMembership?.tier || member?.membershipTier || 'Gold';
  const isGold = memberTier?.toLowerCase() === 'gold';
  const isSilver = memberTier?.toLowerCase() === 'silver';
  
  // Pricing breakdown
  const standardHourlyRate = court.hourlyRate || 800;
  const memberDiscountedRate = court.memberRate || (standardHourlyRate * 0.5);
  const finalRate = isGold ? 0 : memberDiscountedRate;

  // Next daily usage projection
  const currentUsage = dailyUsage?.usedCount ?? 0;
  const projectedUsage = Math.min(currentUsage + 1, 2);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setApiError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        courtId: court.id,
        bookingDate: date,
        date,
        startTime: slot.startIso,
        endTime: slot.endIso,
        memberId: member?.id || 'MEM-8801',
        guestName: member?.name || `${member?.firstName || 'Member'} ${member?.lastName || ''}`.trim() || 'Club Member',
        guestEmail: member?.email || 'member@championsclub.com',
        guestPhone: member?.phone || '+919876543210',
        bookingType: 'ordinary',
        notes: notes.trim() || null
      };

      const result = await createBooking(payload);
      setConfirmedBooking(result);
      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err) {
      console.error('[Booking Error]', err);
      // Display authoritative error message from backend
      setApiError(err.message || 'The requested court slot is already booked and conflicts with an existing booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setApiError(null);
    setConfirmedBooking(null);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl bg-[#02140e] border border-[#dfc99a]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#dfc99a]/15 flex items-center justify-between bg-gradient-to-r from-[#031c13] to-[#02140e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#dfc99a]/10 border border-[#dfc99a]/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#dfc99a]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {confirmedBooking ? 'Booking Confirmed' : 'Review & Confirm Reservation'}
              </h3>
              <span className="text-[11px] text-[#ede0c4]/60">
                The Champions Club Court Concierge
              </span>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-xl text-[#ede0c4]/60 hover:text-white hover:bg-[#07261c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* CONFIRMED STATE */}
          {confirmedBooking ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-widest text-[#dfc99a] font-bold">
                  Official Confirmation Receipt
                </span>
                <h4 className="text-2xl font-black text-white">Court Locked Successfully</h4>
                <p className="text-xs text-[#ede0c4]/80 max-w-sm mx-auto">
                  Your reservation has been confirmed and locked into the club schedule database.
                </p>
              </div>

              {/* Receipt Card */}
              <div className="p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/20 text-left space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#dfc99a]/15">
                  <span className="text-xs text-[#ede0c4]/60">Booking Reference</span>
                  <span className="text-xs font-mono font-black text-[#dfc99a] bg-[#02140e] px-2.5 py-1 rounded-lg border border-[#dfc99a]/30">
                    {confirmedBooking.bookingNumber || confirmedBooking.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#ede0c4]/60 block text-[11px]">Facility</span>
                    <strong className="text-white font-bold">{court.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#ede0c4]/60 block text-[11px]">Surface</span>
                    <strong className="text-white font-bold">{court.surface}</strong>
                  </div>
                  <div>
                    <span className="text-[#ede0c4]/60 block text-[11px]">Date</span>
                    <strong className="text-white font-bold">{date}</strong>
                  </div>
                  <div>
                    <span className="text-[#ede0c4]/60 block text-[11px]">Time Session</span>
                    <strong className="text-emerald-400 font-bold">{slot.timeLabel} (1 Hr)</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dfc99a]/15 flex items-center justify-between text-xs">
                  <span className="text-[#ede0c4]/60">Rate Applied:</span>
                  <span className="font-bold text-white">
                    {confirmedBooking.rateApplied === 0 ? (
                      <span className="text-[#dfc99a]">₹0 (Gold Member Privilege)</span>
                    ) : (
                      `₹${confirmedBooking.rateApplied}`
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] font-extrabold text-xs shadow-md shadow-[#dfc99a]/20 hover:opacity-95 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* REVIEW & CONFIRM FORM */
            <form onSubmit={handleSubmitBooking} className="space-y-5">
              {/* AUTHORITATIVE ERROR BANNER */}
              {apiError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1.5 animate-shake">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Slot Reservation Error</span>
                  </div>
                  <p className="text-[11px] leading-relaxed pl-6">{apiError}</p>
                </div>
              )}

              {/* Court & Session Details Box */}
              <div className="p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/20 space-y-3">
                <div className="flex items-start justify-between pb-3 border-b border-[#dfc99a]/15">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{court.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dfc99a]/15 text-[#dfc99a] font-bold">
                        {court.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#ede0c4]/60">{court.surface}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#ede0c4]/60 font-semibold block">Duration</span>
                    <span className="text-xs font-bold text-[#f4efe4]">1 Hour Exact</span>
                  </div>
                </div>

                {/* Date & Time pill */}
                <div className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 text-[#ede0c4]">
                    <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span className="font-semibold">{date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.timeLabel}</span>
                  </div>
                </div>
              </div>

              {/* Member Tier & Daily Usage Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#031811] border border-[#dfc99a]/15 space-y-1">
                  <span className="text-[#ede0c4]/60 text-[11px] block">Primary Member</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    {isGold && <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />}
                    <span>{member?.name || 'Devon Conway'}</span>
                    <span className="text-[10px] text-[#dfc99a] font-extrabold uppercase">({memberTier})</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#031811] border border-[#dfc99a]/15 space-y-1">
                  <span className="text-[#ede0c4]/60 text-[11px] block">Projected Daily Quota</span>
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-bold">{projectedUsage}/2 Sessions</strong>
                    <span className="text-[10px] text-[#dfc99a] font-semibold">(Max 2/day)</span>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown Card */}
              <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/20 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#ede0c4]/70">
                  <span>Standard Guest Hourly Rate</span>
                  <span>₹{standardHourlyRate}</span>
                </div>

                {isGold ? (
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />
                      <span>Gold Tier Full Privilege (100% Waived)</span>
                    </span>
                    <span>-₹{standardHourlyRate}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span>Member Discount Applied</span>
                    <span>-₹{standardHourlyRate - memberDiscountedRate}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#dfc99a]/15 flex items-center justify-between font-bold text-sm">
                  <span className="text-white">Amount Due:</span>
                  <span className={isGold ? 'text-[#dfc99a] font-black' : 'text-white'}>
                    {isGold ? '₹0 (Waived)' : `₹${finalRate}`}
                  </span>
                </div>
              </div>

              {/* Optional Player Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#ede0c4]/80 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#dfc99a]" />
                  <span>Session Notes / Playing Partner (Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Singles match with Rajesh Sharma, need floodlights on"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#041c14] border border-[#dfc99a]/20 text-xs text-white placeholder-[#ede0c4]/30 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              {/* Verification & Submit Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] hover:from-[#fcfaf5] hover:to-[#ede0c4] text-[#02140e] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#dfc99a]/20 transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#02140e]" />
                      <span>Verifying Slot with Server...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Lock Court</span>
                      <ArrowRight className="w-4 h-4 text-[#02140e]" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-[#ede0c4]/50">
                  Instant mobile cancellation available up to 4 hours before play.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
