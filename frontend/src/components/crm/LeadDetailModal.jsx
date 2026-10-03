import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  ExternalLink,
  Plus,
  Send,
  Loader2,
  Tag
} from 'lucide-react';
import { 
  getLeadById, 
  updateLead, 
  LEAD_STATUSES 
} from '../../features/crm/crmApi.js';

export default function LeadDetailModal({ 
  leadId, 
  isOpen, 
  onClose, 
  onLeadUpdated,
  onOpenAddFollowup,
  onOpenCreateQuote,
  onOpenBookTrial
}) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'followups' | 'quotes' | 'trials'
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState(null);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLeadById(leadId);
      setLead(data);
    } catch (err) {
      console.error('Error loading lead details:', err);
      setError(err.message || 'Could not retrieve lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    }
  }, [isOpen, leadId]);

  if (!isOpen) return null;

  const handleStatusChange = async (newStatus) => {
    if (!lead || lead.status === newStatus) return;

    setUpdatingStatus(true);
    setStatusSuccessMessage(null);
    try {
      const updated = await updateLead(lead.id, { status: newStatus });
      setLead(prev => ({ ...prev, ...updated, status: newStatus }));
      setStatusSuccessMessage(`Status transitioned to '${newStatus}'.`);
      setTimeout(() => setStatusSuccessMessage(null), 3000);
      if (onLeadUpdated) {
        onLeadUpdated(updated);
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert(err.message || 'Failed to update lead status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertLead = async () => {
    await handleStatusChange('converted');
  };

  const currentStatusObj = LEAD_STATUSES.find(s => s.value === lead?.status) || LEAD_STATUSES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010b07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#041c14] border border-emerald-900/50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#06261b] via-[#041c14] to-[#02140e] border-b border-emerald-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center font-bold text-lg shadow-lg">
              {lead ? lead.name.charAt(0) : 'L'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-serif font-bold text-[#fcfaf5]">
                  {lead ? lead.name : 'Loading Lead...'}
                </h3>
                {lead && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentStatusObj.color}`}>
                    {currentStatusObj.label}
                  </span>
                )}
                {lead?.status === 'converted' && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Member Converted</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-300/70 mt-0.5 font-mono">
                Enquiry Ref: {lead?.id} • Source: {lead?.source || 'Website'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-emerald-400/80 hover:text-white hover:bg-[#07261c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-[#06261b] rounded-2xl" />
              <div className="h-40 bg-[#06261b] rounded-2xl" />
            </div>
          )}

          {!loading && error && (
            <div className="p-8 text-center space-y-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="text-sm font-bold">Enquiry Lead Not Found</h4>
              <p className="text-xs">{error}</p>
              <button
                type="button"
                onClick={fetchLeadDetails}
                className="px-4 py-2 bg-[#06261b] text-xs font-semibold text-white rounded-xl"
              >
                Retry Loading
              </button>
            </div>
          )}

          {!loading && lead && (
            <>
              {/* Quick Status Bar & Actions */}
              <div className="p-4 bg-[#02140e] border border-emerald-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs text-emerald-300/70 font-semibold uppercase tracking-wider">Update Pipeline Status:</span>
                  <select
                    value={lead.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#041c14] border border-emerald-800 text-xs text-white font-bold focus:outline-none focus:border-[#dfc99a]"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-[#041c14] text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {statusSuccessMessage && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{statusSuccessMessage}</span>
                  </span>
                )}

                {lead.status !== 'converted' && (
                  <button
                    type="button"
                    onClick={handleConvertLead}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Mark Converted to Member</span>
                  </button>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-emerald-900/40 pb-2 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeTab === 'overview'
                      ? 'btn-champagne shadow-sm'
                      : 'text-emerald-300/70 hover:text-white bg-[#02140e] border border-emerald-900/40'
                  }`}
                >
                  Overview & Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('followups')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'followups'
                      ? 'btn-champagne shadow-sm'
                      : 'text-emerald-300/70 hover:text-white bg-[#02140e] border border-emerald-900/40'
                  }`}
                >
                  <span>Follow-ups</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#02140e] text-[#dfc99a]">
                    {lead.followups?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quotes')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'quotes'
                      ? 'btn-champagne shadow-sm'
                      : 'text-emerald-300/70 hover:text-white bg-[#02140e] border border-emerald-900/40'
                  }`}
                >
                  <span>Quotations</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#02140e] text-[#dfc99a]">
                    {lead.quotations?.length || 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('trials')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'trials'
                      ? 'btn-champagne shadow-sm'
                      : 'text-emerald-300/70 hover:text-white bg-[#02140e] border border-emerald-900/40'
                  }`}
                >
                  <span>Court Trials</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#02140e] text-[#dfc99a]">
                    {lead.trials?.length || 0}
                  </span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 text-xs">
                  {/* Visitor Contact Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-1">
                      <span className="text-[10px] text-emerald-400/70 font-semibold uppercase">Email Contact</span>
                      <div className="text-white font-medium flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#dfc99a] shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-1">
                      <span className="text-[10px] text-emerald-400/70 font-semibold uppercase">Phone Number</span>
                      <div className="text-white font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#dfc99a] shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-1">
                      <span className="text-[10px] text-emerald-400/70 font-semibold uppercase">Sport & Interest Tier</span>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#dfc99a] shrink-0" />
                        <span>{lead.sport || 'Multi-Sport'} • {lead.interestTier || lead.interest_tier || 'Gold'} Tier</span>
                      </div>
                    </div>
                  </div>

                  {/* Visitor Original Message */}
                  <div className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-2">
                    <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider block">
                      Enquiry Message & Request Details:
                    </span>
                    <p className="text-emerald-100/90 leading-relaxed italic bg-[#041c14] p-3 rounded-xl border border-emerald-900/40">
                      "{lead.message || 'No specific enquiry message provided by visitor.'}"
                    </p>
                  </div>

                  {/* Quick Action Dispatch Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenAddFollowup(lead)}
                      className="p-3 bg-[#02140e] hover:bg-[#07261c] text-[#ede0c4] border border-emerald-900/60 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-[#dfc99a]" />
                      <span>Log Follow-up</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenCreateQuote(lead)}
                      className="p-3 bg-[#02140e] hover:bg-[#07261c] text-[#ede0c4] border border-emerald-900/60 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4 text-[#dfc99a]" />
                      <span>Send Quotation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenBookTrial(lead)}
                      className="p-3 bg-[#02140e] hover:bg-[#07261c] text-[#ede0c4] border border-emerald-900/60 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
                    >
                      <Calendar className="w-4 h-4 text-[#dfc99a]" />
                      <span>Book Court Trial</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: FOLLOW-UPS TIMELINE */}
              {activeTab === 'followups' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white uppercase tracking-wider">Follow-up Communication Timeline</h4>
                    <button
                      type="button"
                      onClick={() => onOpenAddFollowup(lead)}
                      className="px-3 py-1.5 btn-champagne rounded-xl font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Follow-up</span>
                    </button>
                  </div>

                  {(!lead.followups || lead.followups.length === 0) ? (
                    <div className="p-8 text-center bg-[#02140e] border border-emerald-900/40 rounded-2xl text-emerald-400/70">
                      No follow-ups recorded yet. Click "Add Follow-up" to log phone, email or in-person discussion.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lead.followups.map((fup, idx) => (
                        <div key={fup.id || idx} className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#07261c] text-[#dfc99a] border border-[#dfc99a]/30">
                              {fup.contactMethod || fup.contact_method || 'phone'}
                            </span>
                            <span className="text-[11px] text-emerald-400/60 font-mono">
                              {new Date(fup.followupDate || fup.followup_date || fup.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-white leading-relaxed">{fup.summary}</p>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-900/30 text-[11px] text-emerald-300/70">
                            <span>Outcome: <strong className="text-emerald-200">{fup.outcome || 'N/A'}</strong></span>
                            {(fup.nextActionDate || fup.next_action_date) && (
                              <span className="text-[#dfc99a]">
                                Next Action: {fup.nextActionDate || fup.next_action_date}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: QUOTATIONS */}
              {activeTab === 'quotes' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white uppercase tracking-wider">Dispatched Membership Quotations</h4>
                    <button
                      type="button"
                      onClick={() => onOpenCreateQuote(lead)}
                      className="px-3 py-1.5 btn-champagne rounded-xl font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Quotation</span>
                    </button>
                  </div>

                  {(!lead.quotations || lead.quotations.length === 0) ? (
                    <div className="p-8 text-center bg-[#02140e] border border-emerald-900/40 rounded-2xl text-emerald-400/70">
                      No proposals dispatched yet. Send a personalized quotation to convert this enquiry.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lead.quotations.map((qt, idx) => (
                        <div key={qt.id || idx} className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[#dfc99a] text-sm">
                              {qt.quotationNumber || qt.quotation_number}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {qt.status || 'sent'}
                            </span>
                          </div>
                          <h5 className="font-bold text-white">{qt.title}</h5>
                          <div className="flex items-center justify-between text-emerald-200 font-mono">
                            <span>Proposed Total: ₹{Number(qt.amount).toLocaleString('en-IN')}</span>
                            {Number(qt.discountAmount || qt.discount_amount || 0) > 0 && (
                              <span className="text-emerald-400">
                                Discount: -₹{Number(qt.discountAmount || qt.discount_amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          {qt.terms && <p className="text-emerald-400/70 italic text-[11px]">{qt.terms}</p>}
                          <div className="text-[10px] text-emerald-500/80 pt-1 border-t border-emerald-900/30">
                            Valid until: {qt.validUntil || qt.valid_until}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TRIALS */}
              {activeTab === 'trials' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white uppercase tracking-wider">Scheduled Court Trial Sessions</h4>
                    <button
                      type="button"
                      onClick={() => onOpenBookTrial(lead)}
                      className="px-3 py-1.5 btn-champagne rounded-xl font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Book Trial</span>
                    </button>
                  </div>

                  {(!lead.trials || lead.trials.length === 0) ? (
                    <div className="p-8 text-center bg-[#02140e] border border-emerald-900/40 rounded-2xl text-emerald-400/70">
                      No court trials booked for this visitor. Reserve a slot to let them experience the facilities.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lead.trials.map((tr, idx) => (
                        <div key={tr.id || idx} className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {tr.courtName || tr.courtId || tr.court_id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/30">
                              {tr.status || 'scheduled'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-200">
                            <Clock className="w-3.5 h-3.5 text-[#dfc99a]" />
                            <span>
                              {new Date(tr.scheduledTime || tr.scheduled_time).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })} ({tr.durationMinutes || tr.duration_minutes || 60} mins)
                            </span>
                          </div>
                          {tr.feedback && <p className="text-emerald-400/70 italic text-[11px]">{tr.feedback}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-[#02140e] border-t border-emerald-900/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-emerald-400/60 font-mono">
            Created: {lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : 'Recently'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold btn-champagne"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
