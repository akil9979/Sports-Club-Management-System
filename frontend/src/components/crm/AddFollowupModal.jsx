import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MessageSquare, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { createLeadFollowup, CONTACT_METHODS } from '../../features/crm/crmApi.js';

export default function AddFollowupModal({ isOpen, onClose, lead, onFollowupCreated }) {
  const [contactMethod, setContactMethod] = useState('phone');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!summary.trim()) {
      setErrorMessage('Please enter a follow-up summary note.');
      return;
    }

    setLoading(true);
    try {
      const created = await createLeadFollowup(lead.id, {
        contactMethod,
        summary: summary.trim(),
        outcome: outcome.trim() || 'Follow-up logged',
        nextActionDate: nextActionDate || null
      });

      if (onFollowupCreated) {
        onFollowupCreated(created);
      }
      onClose();
    } catch (err) {
      console.error('Follow-up error:', err);
      setErrorMessage(err.message || 'Failed to record follow-up. Please retry.');
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
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#fcfaf5]">Log Staff Follow-up</h3>
              <p className="text-xs text-emerald-300/70">
                Enquiry: <strong className="text-white">{lead.name}</strong> ({lead.phone})
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

          {/* Contact Method Selector */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1.5">
              Contact Method <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONTACT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setContactMethod(m.value)}
                  className={`p-2.5 rounded-xl border text-center font-medium transition flex flex-col items-center gap-1 ${
                    contactMethod === m.value
                      ? 'btn-champagne font-bold shadow-md shadow-[#dfc99a]/10'
                      : 'bg-[#02140e] border-emerald-900/50 text-emerald-300/80 hover:border-emerald-700/60 hover:text-white'
                  }`}
                >
                  {m.value === 'phone' && <Phone className="w-3.5 h-3.5" />}
                  {m.value === 'email' && <Mail className="w-3.5 h-3.5" />}
                  {m.value === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                  {m.value === 'in_person' && <Users className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Summary (Required) */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Discussion Summary & Feedback Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Called visitor to discuss Gold tier off-peak court timings. Interested in 1-on-1 coaching assessment."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white placeholder-emerald-700/50 focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Conversation Outcome / Current Sentiment
            </label>
            <input
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g. Highly interested, requested quote sent via email"
              className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white placeholder-emerald-700/50 focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Next Action Date */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Next Action / Follow-up Reminder Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-emerald-900/40">
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log Follow-up</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
