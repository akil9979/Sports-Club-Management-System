import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Plus, 
  ChevronRight,
  UserCheck,
  TrendingUp,
  Clock,
  Send
} from 'lucide-react';
import { 
  getLeads, 
  LEAD_STATUSES, 
  resetInMemoryCrmState 
} from '../../features/crm/crmApi.js';
import LeadDetailModal from '../../components/crm/LeadDetailModal.jsx';
import AddFollowupModal from '../../components/crm/AddFollowupModal.jsx';
import CreateQuotationModal from '../../components/crm/CreateQuotationModal.jsx';
import BookTrialModal from '../../components/crm/BookTrialModal.jsx';

export default function CrmWorkspacePage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sportFilter, setSportFilter] = useState('all');

  // Active Modals State
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [activeLeadForAction, setActiveLeadForAction] = useState(null);
  const [isAddFollowupOpen, setIsAddFollowupOpen] = useState(false);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);
  const [isBookTrialOpen, setIsBookTrialOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLeadsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeads({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sport: sportFilter !== 'all' ? sportFilter : undefined,
        search: searchQuery.trim() || undefined
      });
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError('Could not retrieve enquiry leads. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsList();
  }, [statusFilter, sportFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchLeadsList();
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const trials = leads.filter(l => l.status === 'trial_booked').length;
    const quotes = leads.filter(l => l.status === 'quoted').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return { total, newLeads, contacted, trials, quotes, converted, conversionRate };
  }, [leads]);

  // Modal Triggers
  const handleOpenDetails = (leadId) => {
    setSelectedLeadId(leadId);
    setIsDetailOpen(true);
  };

  const handleOpenFollowup = (lead) => {
    setActiveLeadForAction(lead);
    setIsAddFollowupOpen(true);
  };

  const handleOpenQuote = (lead) => {
    setActiveLeadForAction(lead);
    setIsCreateQuoteOpen(true);
  };

  const handleOpenTrial = (lead) => {
    setActiveLeadForAction(lead);
    setIsBookTrialOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#041c14] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CRM Overview Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#041c14]/90 border border-emerald-900/40 space-y-1 shadow-lg backdrop-blur-md">
          <div className="text-[10px] text-emerald-400/70 font-semibold uppercase">Total Enquiries</div>
          <div className="text-2xl font-serif font-black text-white">{metrics.total}</div>
          <span className="text-[10px] text-emerald-500/80">Website & Walk-ins</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041c14]/90 border border-sky-500/30 space-y-1 shadow-lg backdrop-blur-md">
          <div className="text-[10px] text-sky-400 font-semibold uppercase">New Uncontacted</div>
          <div className="text-2xl font-serif font-black text-sky-300">{metrics.newLeads}</div>
          <span className="text-[10px] text-sky-400/70">Needs First Follow-up</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041c14]/90 border border-[#dfc99a]/30 space-y-1 shadow-lg backdrop-blur-md">
          <div className="text-[10px] text-[#dfc99a] font-semibold uppercase">Trials Booked</div>
          <div className="text-2xl font-serif font-black text-[#dfc99a]">{metrics.trials}</div>
          <span className="text-[10px] text-[#dfc99a]/70">Testing Club Courts</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041c14]/90 border border-purple-500/30 space-y-1 shadow-lg backdrop-blur-md">
          <div className="text-[10px] text-purple-400 font-semibold uppercase">Quotes Sent</div>
          <div className="text-2xl font-serif font-black text-purple-300">{metrics.quotes}</div>
          <span className="text-[10px] text-purple-400/70">Active Proposals</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041c14]/90 border border-emerald-500/30 space-y-1 shadow-lg backdrop-blur-md">
          <div className="text-[10px] text-emerald-400 font-semibold uppercase">Converted Members</div>
          <div className="text-2xl font-serif font-black text-emerald-400">{metrics.converted}</div>
          <span className="text-[10px] text-emerald-400/70">Official Club Members</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#041c14]/90 border border-[#dfc99a]/40 space-y-1 shadow-lg backdrop-blur-md">
          <div className="text-[10px] text-[#dfc99a] font-semibold uppercase">Conversion Rate</div>
          <div className="text-2xl font-serif font-black text-white">{metrics.conversionRate}%</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Lead to Membership</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#fcfaf5] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#dfc99a]" />
              <span>Visitor Enquiries & Follow-up Coordination</span>
            </h3>
            <p className="text-xs text-emerald-300/70">
              Track website leads, schedule court trials, issue welcome quotes, and convert prospects.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                resetInMemoryCrmState();
                fetchLeadsList();
                showToast('CRM demo leads reset to initial seed state.');
              }}
              className="px-3 py-1.5 bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>Reset Demo CRM</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-3 border-t border-emerald-900/40">
          {/* Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'btn-champagne shadow-sm'
                  : 'bg-[#02140e] text-emerald-300/80 border border-emerald-900/50 hover:text-white'
              }`}
            >
              All ({leads.length})
            </button>
            {LEAD_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap border ${
                  statusFilter === s.value
                    ? s.color + ' ring-1 ring-[#dfc99a]/30'
                    : 'bg-[#02140e] border-emerald-900/50 text-emerald-300/80 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Search Bar & Sport Filter */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-emerald-200 focus:outline-none focus:border-[#dfc99a]"
            >
              <option value="all">All Sports</option>
              <option value="tennis">Tennis</option>
              <option value="cricket">Cricket</option>
              <option value="padel">Padel</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, phone, email..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-white placeholder-emerald-700/60 focus:outline-none focus:border-[#dfc99a]"
              />
              <Search className="w-3.5 h-3.5 text-[#dfc99a] absolute left-3 top-2.5" />
            </form>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-[#06261b] rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#06261b]/60 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h4 className="text-base font-serif font-bold text-rose-200">Failed to Load Enquiries</h4>
          <p className="text-xs text-rose-300/80 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={fetchLeadsList}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && leads.length === 0 && (
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#02140e] border border-emerald-900/60 flex items-center justify-center text-[#dfc99a]/50 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-serif font-bold text-white">No Enquiries Found</h4>
            <p className="text-xs text-emerald-300/70 max-w-md mx-auto">
              No visitor leads match the active search or status filter. Try clearing filters or submit a new trial inquiry from the public site.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSportFilter('all');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold btn-champagne shadow-md"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Leads Table & Cards List */}
      {!loading && !error && leads.length > 0 && (
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl overflow-hidden shadow-xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#02140e] border-b border-emerald-900/40 text-emerald-400/70 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4">Visitor Name & Lead ID</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Sport & Tier</th>
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Coordination Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/30">
                {leads.map((lead) => {
                  const statusObj = LEAD_STATUSES.find(s => s.value === lead.status) || LEAD_STATUSES[0];

                  return (
                    <tr 
                      key={lead.id}
                      className="hover:bg-[#07261c]/40 transition group cursor-pointer"
                      onClick={() => handleOpenDetails(lead.id)}
                    >
                      {/* Name & ID */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] font-bold text-xs flex items-center justify-center border border-[#dfc99a]/30">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block group-hover:text-[#dfc99a] transition-colors text-sm">
                              {lead.name}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400/60">
                              {lead.id} • {lead.source || 'website'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="text-white flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#dfc99a]" />
                            <span>{lead.phone}</span>
                          </div>
                          <div className="text-emerald-400/70 flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-emerald-500/70" />
                            <span>{lead.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Sport & Interest Tier */}
                      <td className="p-4">
                        <div>
                          <span className="font-semibold text-white block">
                            {lead.sport || 'Multi-Sport'}
                          </span>
                          <span className="text-[10px] text-[#dfc99a] font-bold">
                            {lead.interestTier || lead.interest_tier || 'Gold'} Tier
                          </span>
                        </div>
                      </td>

                      {/* Pipeline Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusObj.color}`}>
                          {statusObj.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-emerald-400/70 font-mono text-[11px]">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Recent'}
                      </td>

                      {/* Fast Action Buttons */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenFollowup(lead)}
                            className="p-2 rounded-xl bg-[#02140e] hover:bg-[#07261c] text-emerald-300 border border-emerald-900/60 hover:border-[#dfc99a]/40 transition"
                            title="Log Follow-up"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#dfc99a]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenQuote(lead)}
                            className="p-2 rounded-xl bg-[#02140e] hover:bg-[#07261c] text-emerald-300 border border-emerald-900/60 hover:border-[#dfc99a]/40 transition"
                            title="Send Quote"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#dfc99a]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenTrial(lead)}
                            className="p-2 rounded-xl bg-[#02140e] hover:bg-[#07261c] text-emerald-300 border border-emerald-900/60 hover:border-[#dfc99a]/40 transition"
                            title="Book Court Trial"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDetails(lead.id)}
                            className="px-3 py-1.5 rounded-xl btn-champagne font-bold text-xs flex items-center gap-1 shadow-sm ml-1"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals Mounting */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onLeadUpdated={(updated) => {
          setLeads(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
          showToast(`Updated enquiry for ${updated.name}`);
        }}
        onOpenAddFollowup={(lead) => handleOpenFollowup(lead)}
        onOpenCreateQuote={(lead) => handleOpenQuote(lead)}
        onOpenBookTrial={(lead) => handleOpenTrial(lead)}
      />

      <AddFollowupModal
        isOpen={isAddFollowupOpen}
        lead={activeLeadForAction}
        onClose={() => setIsAddFollowupOpen(false)}
        onFollowupCreated={(fup) => {
          showToast(`Follow-up logged for ${activeLeadForAction.name}`);
          fetchLeadsList();
        }}
      />

      <CreateQuotationModal
        isOpen={isCreateQuoteOpen}
        lead={activeLeadForAction}
        onClose={() => setIsCreateQuoteOpen(false)}
        onQuotationCreated={(qt) => {
          showToast(`Quotation ${qt.quotationNumber} sent to ${activeLeadForAction.name}`);
          fetchLeadsList();
        }}
      />

      <BookTrialModal
        isOpen={isBookTrialOpen}
        lead={activeLeadForAction}
        onClose={() => setIsBookTrialOpen(false)}
        onTrialBooked={(tr) => {
          showToast(`Trial session booked on ${tr.courtName} for ${activeLeadForAction.name}`);
          fetchLeadsList();
        }}
      />
    </div>
  );
}
