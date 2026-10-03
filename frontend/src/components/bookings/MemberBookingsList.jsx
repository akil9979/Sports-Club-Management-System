import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  Trophy, 
  FileText,
  Filter
} from 'lucide-react';
import { cancelBooking } from '../../features/bookings/bookingApi.js';

/**
 * MemberBookingsList Component
 * Displays the member's current and past bookings with real-time cancellation action.
 */
export default function MemberBookingsList({
  bookings = [],
  memberId,
  isLoading = false,
  onBookingCancelled
}) {
  const [filter, setFilter] = useState('all'); // all | confirmed | cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmModalBooking, setConfirmModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Personal schedule conflict');
  const [cancelError, setCancelError] = useState(null);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const handleOpenCancelModal = (booking) => {
    setCancelError(null);
    setCancelReason('Personal schedule conflict');
    setConfirmModalBooking(booking);
  };

  const handleConfirmCancel = async () => {
    if (!confirmModalBooking) return;
    setCancellingId(confirmModalBooking.id);
    setCancelError(null);

    try {
      await cancelBooking(confirmModalBooking.id, cancelReason);
      setConfirmModalBooking(null);
      if (onBookingCancelled) {
        onBookingCancelled(confirmModalBooking.id);
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setCancelError(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/15">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            My Court Reservations
          </h3>
          <span className="text-xs text-[#ede0c4]/60">
            {bookings.length} total booking{bookings.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#dfc99a] mr-1 hidden sm:inline" />
          {[
            { id: 'all', label: 'All' },
            { id: 'confirmed', label: 'Active & Confirmed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] font-bold shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#07261c]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#031811] border border-[#dfc99a]/10 space-y-2 animate-pulse">
              <div className="h-4 w-40 bg-[#07261c] rounded"></div>
              <div className="h-4 w-60 bg-[#07261c] rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && filteredBookings.length === 0 && (
        <div className="p-10 rounded-2xl bg-[#031811] border border-[#dfc99a]/15 text-center space-y-3">
          <Calendar className="w-10 h-10 text-[#dfc99a]/40 mx-auto" />
          <h4 className="text-white font-bold text-base">No Reservations Found</h4>
          <p className="text-xs text-[#ede0c4]/70 max-w-sm mx-auto">
            {filter === 'all'
              ? 'You have not reserved any court sessions yet. Select an open slot above to book your court.'
              : `No ${filter} bookings found.`}
          </p>
        </div>
      )}

      {/* BOOKINGS LIST */}
      {!isLoading && filteredBookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const isCancelled = b.status === 'cancelled';
            const isConfirmed = b.status === 'confirmed';

            // Format date & time
            const dateStr = b.bookingDate || (b.startTime ? b.startTime.split('T')[0] : '');
            let timeStr = '';
            if (b.startTime && b.endTime) {
              const startH = b.startTime.includes('T') ? b.startTime.split('T')[1].slice(0, 5) : b.startTime;
              const endH = b.endTime.includes('T') ? b.endTime.split('T')[1].slice(0, 5) : b.endTime;
              timeStr = `${startH} - ${endH}`;
            }

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isCancelled
                    ? 'bg-[#02140e]/60 border-rose-500/20 opacity-70'
                    : 'bg-[#031811] border-[#dfc99a]/20 hover:border-[#dfc99a]/50 shadow-md'
                }`}
              >
                {/* Header: Court Name & Status Badge */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#dfc99a] block font-bold">
                        {b.bookingNumber || b.id}
                      </span>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {b.courtName || `Court ${b.courtId}`}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        isConfirmed
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isCancelled
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-[#02140e] text-[#ede0c4] border-[#dfc99a]/20'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Date & Time pill */}
                  <div className="flex items-center gap-3 pt-2 text-xs text-[#ede0c4]/80">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
                      <span className="font-semibold text-white">{dateStr}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-white">{timeStr || '1 Hour Session'}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Cancellation Reason */}
                <div className="pt-3 border-t border-[#dfc99a]/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#ede0c4]/60 uppercase block">Fee Applied</span>
                    <span className="font-bold text-white">
                      {b.rateApplied === 0 || b.paymentStatus === 'waived' ? (
                        <span className="text-[#dfc99a]">₹0 (Complimentary)</span>
                      ) : (
                        `₹${b.rateApplied || b.totalAmount}`
                      )}
                    </span>
                  </div>

                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(b)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cancel Slot</span>
                    </button>
                  )}

                  {isCancelled && b.cancellationReason && (
                    <div className="text-right">
                      <span className="text-[10px] text-rose-300 block">Reason:</span>
                      <span className="text-[11px] text-[#ede0c4]/60 italic max-w-[150px] truncate block">
                        {b.cancellationReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {confirmModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#02140e] border border-rose-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Cancel Court Reservation?</h4>
                <p className="text-xs text-[#ede0c4]/70">
                  This action will immediately release the slot back to the public pool and restore your daily quota.
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {cancelError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-[#ede0c4]/80 font-semibold block">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#041c14] border border-[#dfc99a]/20 text-xs text-white focus:outline-none focus:border-[#dfc99a]"
              >
                <option value="Personal schedule conflict">Personal schedule conflict</option>
                <option value="Inclement weather / Rain">Inclement weather / Rain</option>
                <option value="Opponent unable to attend">Opponent unable to attend</option>
                <option value="Injury or illness">Injury or illness</option>
                <option value="Rescheduling to another date">Rescheduling to another date</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalBooking(null)}
                className="w-1/2 py-2.5 rounded-xl bg-[#041c14] text-[#ede0c4] hover:text-white border border-[#dfc99a]/20 text-xs font-semibold"
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={handleConfirmCancel}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/40 transition disabled:opacity-60"
              >
                {cancellingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Releasing...</span>
                  </>
                ) : (
                  <span>Confirm Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
