import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { createLeadTrial } from '../../features/crm/crmApi.js';

const COURTS_LIST = [
  { id: 'court-1', name: 'Centre Court (Tennis)', sport: 'Tennis' },
  { id: 'court-2', name: 'Court 2 - Clay (Tennis)', sport: 'Tennis' },
  { id: 'court-3', name: 'Box Cricket Arena 1', sport: 'Cricket' },
  { id: 'court-4', name: 'Box Cricket Arena 2', sport: 'Cricket' },
  { id: 'court-5', name: 'Padel Court Alpha', sport: 'Padel' }
];

export default function BookTrialModal({ isOpen, onClose, lead, onTrialBooked }) {
  const [courtId, setCourtId] = useState('court-1');
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [feedback, setFeedback] = useState('Complimentary session testing turf and racket feel with head coach.');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!courtId) {
      setErrorMessage('Please select a court for the trial session.');
      return;
    }
    if (!scheduledTime) {
      setErrorMessage('Please select a valid scheduled trial time.');
      return;
    }

    setLoading(true);
    try {
      const created = await createLeadTrial(lead.id, {
        courtId,
        scheduledTime: new Date(scheduledTime).toISOString(),
        durationMinutes: Number(durationMinutes),
        feedback: feedback.trim()
      });

      if (onTrialBooked) {
        onTrialBooked(created);
      }
      onClose();
    } catch (err) {
      console.error('Trial booking error:', err);
      setErrorMessage(err.message || 'Failed to book trial session. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010b07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#041c14] border border-emerald-900/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-emerald-900/40 bg-[#02140e]/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#fcfaf5]">Schedule Visitor Court Trial</h3>
              <p className="text-xs text-emerald-300/70">
                Visitor: <strong className="text-white">{lead.name}</strong> ({lead.sport || 'Sports'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-[#07261c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Court Selection */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Select Club Arena / Court <span className="text-rose-400">*</span>
            </label>
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
            >
              {COURTS_LIST.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#041c14] text-white">
                  {c.name} ({c.sport})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Scheduled Date & Start Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Trial Slot Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl border text-center font-medium transition ${
                    durationMinutes === mins
                      ? 'btn-champagne font-bold'
                      : 'bg-[#02140e] border-emerald-900/50 text-emerald-300/80 hover:text-white'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>

          {/* Session Notes */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Session Goal & Coordinator Notes
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Handing racket before warmup, testing synthetic turf."
              className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white placeholder-emerald-700/50 focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-emerald-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#07261c] hover:bg-[#0b3829] text-emerald-300 border border-emerald-800/60 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 btn-champagne font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/15 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm Trial Slot</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
