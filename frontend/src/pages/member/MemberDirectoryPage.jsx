import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Users, 
  Mail, 
  Phone, 
  ChevronRight,
  Crown
} from 'lucide-react';
import { getMembers } from '../../features/membership/membershipApi.js';

function getTierBadgeClass(tier) {
  const t = (tier || '').toUpperCase();
  if (t === 'GOLD') {
    return 'bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 font-extrabold';
  }
  if (t === 'SILVER') {
    return 'bg-slate-700/40 text-slate-200 border border-slate-600/40 font-bold';
  }
  if (t === 'JUNIOR') {
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold';
  }
  return 'bg-[#041c14] text-[#ede0c4]/60 border border-[#dfc99a]/12 font-medium';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export default function MemberDirectoryPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load members:', err);
      setError(err.message || 'Unable to retrieve members roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.memberNumber || '').toLowerCase().includes(q) ||
        (member.id || '').toLowerCase().includes(q) ||
        member.phone.includes(q);

      if (!matchesSearch) return false;

      // Tier filter
      const tier = (member.activeMembership?.tier || 'NONE').toUpperCase();
      if (tierFilter !== 'ALL' && tier !== tierFilter) {
        return false;
      }

      // Status filter
      const hasPlan = Boolean(member.activeMembership);
      const isExpired = member.activeMembership?.status === 'expired';

      if (statusFilter === 'ACTIVE' && (!hasPlan || isExpired)) return false;
      if (statusFilter === 'EXPIRED' && !isExpired) return false;
      if (statusFilter === 'NO_PLAN' && hasPlan) return false;

      return true;
    });
  }, [members, searchQuery, tierFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-[#02140e] text-[#f4efe4] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#ede0c4]/60 mb-2">
              <Link to="/" className="hover:text-[#dfc99a] transition-colors">Club Home</Link>
              <span>/</span>
              <span className="text-[#dfc99a] font-semibold">Member Desk</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Member Roster & Entitlements
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                {members.length} Enrolled
              </span>
            </div>
            <p className="text-sm text-[#ede0c4]/80 mt-1 max-w-2xl">
              Official roster of registered club members. Inspect Gold, Silver, and Junior tiers, validity timelines, and court privileges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/members/register"
              className="btn-champagne inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg"
            >
              <Plus className="w-4 h-4 shrink-0 text-[#02140e]" />
              Enroll New Member
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel rounded-3xl p-5 shadow-2xl space-y-4 border border-[#dfc99a]/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#dfc99a]/70 shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or member #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#02140e] border border-[#dfc99a]/20 rounded-xl text-sm text-white placeholder-[#ede0c4]/40 focus:outline-none focus:border-[#dfc99a] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#ede0c4]/60 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Tier Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#ede0c4] uppercase tracking-wider shrink-0">
                Tier:
              </label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#02140e] border border-[#dfc99a]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#dfc99a]"
              >
                <option value="ALL">All Tiers</option>
                <option value="GOLD">Gold Championship</option>
                <option value="SILVER">Silver Standard</option>
                <option value="JUNIOR">Junior (U18)</option>
                <option value="NONE">Walk-In / None</option>
              </select>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#ede0c4] uppercase tracking-wider shrink-0">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#02140e] border border-[#dfc99a]/20 rounded-xl text-xs text-white focus:outline-none focus:border-[#dfc99a]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Plan</option>
                <option value="EXPIRED">Expired Plan</option>
                <option value="NO_PLAN">Walk-In / Guest</option>
              </select>
            </div>

            <button
              type="button"
              onClick={fetchMembers}
              disabled={loading}
              title="Refresh Roster"
              className="p-2.5 rounded-xl bg-[#041c14] hover:bg-[#07261c] text-[#ede0c4] hover:text-white border border-[#dfc99a]/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin text-[#dfc99a]' : ''}`} />
            </button>
          </div>

          {/* Quick Active Filter Counters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#ede0c4]/70">
            <span>Showing <strong className="text-white">{filteredMembers.length}</strong> of {members.length} members</span>
            {(searchQuery || tierFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTierFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-[#dfc99a] hover:underline font-bold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Member Grid / Roster List */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#dfc99a]/20 border-t-[#dfc99a] rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-[#ede0c4]/70">Retrieving club member roster...</p>
          </div>
        ) : error ? (
          <div className="glass-panel border border-rose-500/30 rounded-3xl p-8 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertCircle className="w-7 h-7 shrink-0" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Failed to load member roster</h3>
            <p className="text-xs text-[#ede0c4]/70 mb-6">{error}</p>
            <button
              type="button"
              onClick={fetchMembers}
              className="px-5 py-2.5 rounded-xl bg-[#041c14] hover:bg-[#07261c] text-white text-xs font-semibold border border-[#dfc99a]/20"
            >
              Retry
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#041c14] text-[#dfc99a]/60 flex items-center justify-center mx-auto mb-4 border border-[#dfc99a]/20">
              <Users className="w-7 h-7 shrink-0" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Members Found</h3>
            <p className="text-xs text-[#ede0c4]/70 max-w-sm mx-auto mb-6">
              No registered club members matched your search query and filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTierFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-[#041c14] hover:bg-[#07261c] text-white text-xs font-semibold border border-[#dfc99a]/20"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map((member) => {
              const activePlan = member.activeMembership;
              const isExpired = activePlan?.status === 'expired';
              const tier = activePlan?.tier || 'No Plan';

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="group glass-panel glass-panel-hover rounded-3xl p-6 shadow-xl cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar, Name, Tier */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] text-[#02140e] font-black text-base flex items-center justify-center shrink-0 shadow-md">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-[#dfc99a] transition-colors">
                            {member.name}
                          </h3>
                          <span className="text-[11px] font-mono text-[#dfc99a]/80 font-bold">
                            {member.memberNumber || member.id}
                          </span>
                        </div>
                      </div>

                      {/* Tier Badge */}
                      {activePlan ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider shrink-0 ${
                          isExpired
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-extrabold'
                            : getTierBadgeClass(tier)
                        }`}>
                          {isExpired ? 'Expired' : tier}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#041c14] text-[#ede0c4]/60 border border-[#dfc99a]/15 shrink-0">
                          Walk-In
                        </span>
                      )}
                    </div>

                    {/* Contact Snippets */}
                    <div className="space-y-1.5 text-xs text-[#ede0c4]/80 mb-4 pb-4 border-b border-[#dfc99a]/12">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#dfc99a]/60 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#dfc99a]/60 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    </div>

                    {/* Subscription Status details */}
                    <div className="text-xs mb-4">
                      {activePlan ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#ede0c4]/60">Plan Tier:</span>
                            <span className="text-white font-bold">{activePlan.planName}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#ede0c4]/60">{isExpired ? 'Expired On:' : 'Renews / Valid:'}</span>
                            <span className={`font-semibold ${isExpired ? 'text-rose-400 font-bold' : 'text-[#dfc99a]'}`}>
                              {formatDate(activePlan.endDate)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/15 text-[11px] text-[#ede0c4]/60 italic">
                          No active subscription. Guest court rates apply.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-3 border-t border-[#dfc99a]/12 flex items-center justify-between text-xs font-bold text-[#dfc99a] group-hover:text-[#f7f1e3]">
                    <span>Inspect Profile & Ledgers</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
