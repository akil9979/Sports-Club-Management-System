import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit3, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { getMember, getMembers } from '../../features/membership/membershipApi.js';
import { calculateAge } from '../../features/membership/memberValidation.js';
import ActiveMembershipCard from '../../features/membership/ActiveMembershipCard.jsx';
import MemberHistoryTable from '../../features/membership/MemberHistoryTable.jsx';
import MemberProfileEditModal from '../../features/membership/MemberProfileEditModal.jsx';
import PlanSelectionModal from '../../features/membership/PlanSelectionModal.jsx';

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

export default function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Quick Switcher roster
  const [roster, setRoster] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchMemberData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMember(id);
      setMember(data);
    } catch (err) {
      console.error('Failed to load member profile:', err);
      setError(err.message || 'Member not found or failed to load profile from backend.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData, refreshKey]);

  // Load roster for demo switcher
  useEffect(() => {
    getMembers()
      .then((data) => {
        setRoster(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.warn('Could not load member roster:', err));
  }, [refreshKey]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleProfileUpdated = (updatedMember) => {
    setMember(updatedMember);
    setRefreshKey((k) => k + 1);
    showToast('Member profile updated successfully!');
  };

  const handleMembershipAssigned = (updatedMember) => {
    setMember(updatedMember);
    setRefreshKey((k) => k + 1);
    showToast('Membership plan activated / renewed successfully!');
  };

  const memberAge = member?.dob ? calculateAge(member.dob) : null;

  return (
    <div className="min-h-screen bg-[#02140e] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400/60 mb-2">
              <Link to="/" className="hover:text-[#dfc99a] transition-colors">Home</Link>
              <span>/</span>
              <Link to="/members" className="hover:text-[#dfc99a] transition-colors">Member Directory</Link>
              <span>/</span>
              <span className="text-[#dfc99a] font-medium">Member Profile</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-black text-[#fcfaf5] tracking-tight">
                {loading ? 'Loading Member...' : member ? member.name : 'Member Profile'}
              </h1>
              {member && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                  {member.memberNumber || member.id}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              All Members
            </Link>

            <Link
              to="/members/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-champagne text-xs font-bold transition-all shadow-lg shadow-[#dfc99a]/15"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Register New
            </Link>
          </div>
        </div>

        {/* Quick Demo Switcher Bar */}
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-3.5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Switch Test Member Profile (Click to inspect live state)
            </span>
            <span className="text-[11px] text-emerald-500/70">
              Covers active, expired, junior, and walk-in states
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {roster.map((m) => {
              const isActive = m.id === id;
              const tier = m.activeMembership?.tier || 'No Plan';
              const isExpired = m.activeMembership?.status === 'expired';

              let badgeColor = 'bg-[#07261c] text-emerald-400 border-emerald-800/60';
              if (tier === 'Gold') badgeColor = isExpired ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/40';
              if (tier === 'Silver') badgeColor = 'bg-slate-700/40 text-slate-200 border-slate-600/40';
              if (tier === 'Junior') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => navigate(`/members/${m.id}`)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#dfc99a]/20 border-[#dfc99a]/60 text-white shadow-md'
                      : 'bg-[#07261c]/80 border-emerald-900/60 text-emerald-200/80 hover:text-white hover:border-emerald-700/60'
                  }`}
                >
                  <span className="font-semibold">{m.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border ${badgeColor}`}>
                    {isExpired ? 'Expired' : tier}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#dfc99a]/20 border-t-[#dfc99a] rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-emerald-300/70">Loading member profile and contract entitlements...</p>
          </div>
        ) : error ? (
          <div className="bg-[#041c14] border border-rose-500/30 rounded-3xl p-8 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Member Profile Error</h3>
            <p className="text-xs text-emerald-400/70 mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={fetchMemberData}
                className="px-4 py-2 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-white text-xs font-semibold border border-emerald-800/60"
              >
                Retry
              </button>
              <Link
                to="/members"
                className="px-4 py-2 rounded-xl btn-champagne text-xs font-bold"
              >
                Return to Directory
              </Link>
            </div>
          </div>
        ) : member ? (
          <>
            {/* Member Details Card */}
            <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-emerald-900/40">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] font-serif font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-[#dfc99a]/15 shrink-0">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-serif font-black text-[#fcfaf5]">{member.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#07261c] text-emerald-300 border border-emerald-800/60">
                        {member.memberNumber || member.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-300/70 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-emerald-500/70 shrink-0" />
                        <span className="text-emerald-100">{member.email}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-500/70 shrink-0" />
                        <span className="text-emerald-100">{member.phone}</span>
                      </div>

                      {memberAge !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600">•</span>
                          <span className="text-emerald-200 font-medium">Age: {memberAge} yrs</span>
                          {memberAge < 18 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Junior Eligible
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 text-xs font-semibold transition-colors"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-champagne font-bold text-xs shadow-lg shadow-[#dfc99a]/15 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    {member.activeMembership ? 'Renew / Upgrade Plan' : 'Activate Membership'}
                  </button>
                </div>
              </div>

              {/* Extra Demographic Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
                <div>
                  <span className="text-emerald-400/60 block uppercase tracking-wider text-[10px] font-medium">Date of Birth</span>
                  <span className="text-emerald-100 font-semibold mt-0.5 block">
                    {formatDate(member.dob)}
                  </span>
                </div>

                <div>
                  <span className="text-emerald-400/60 block uppercase tracking-wider text-[10px] font-medium">Gender</span>
                  <span className="text-emerald-100 font-semibold mt-0.5 block">
                    {member.gender || 'Not specified'}
                  </span>
                </div>

                <div>
                  <span className="text-emerald-400/60 block uppercase tracking-wider text-[10px] font-medium">Emergency Contact</span>
                  <span className="text-emerald-100 font-semibold mt-0.5 block">
                    {member.emergencyContact || 'None recorded'}
                  </span>
                </div>

                <div>
                  <span className="text-emerald-400/60 block uppercase tracking-wider text-[10px] font-medium">Member Since</span>
                  <span className="text-emerald-100 font-semibold mt-0.5 block">
                    {formatDate(member.createdAt)}
                  </span>
                </div>

                {member.address && (
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-emerald-900/40">
                    <span className="text-emerald-400/60 uppercase tracking-wider text-[10px] font-medium">Address</span>
                    <span className="text-emerald-200 block mt-0.5">{member.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Membership Tier & Entitlements Card */}
            <ActiveMembershipCard
              membership={member.activeMembership}
              onRenewClick={() => setIsPlanModalOpen(true)}
            />

            {/* Membership History Audit Table */}
            <MemberHistoryTable
              memberId={member.id}
              refreshTrigger={refreshKey}
              onRenewClick={() => setIsPlanModalOpen(true)}
            />
          </>
        ) : null}

        {/* Profile Edit Modal */}
        <MemberProfileEditModal
          isOpen={isEditModalOpen}
          member={member}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleProfileUpdated}
        />

        {/* Plan Upgrade / Renewal Modal */}
        <PlanSelectionModal
          isOpen={isPlanModalOpen}
          member={member}
          onClose={() => setIsPlanModalOpen(false)}
          onSuccess={handleMembershipAssigned}
        />
      </div>
    </div>
  );
}
