import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Trophy, 
  Crown, 
  Clock, 
  ShieldCheck, 
  Users, 
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import CourtBookingPanel from '../../components/bookings/CourtBookingPanel.jsx';
import { getMemberById } from '../../services/api.js';

export default function MemberBookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [currentMember, setCurrentMember] = useState(null);

  // Default pre-seeded demo members for testing/preview if no user logged in
  const demoMembers = [
    { id: 'MEM-8801', name: 'Devon Conway', tier: 'Gold', email: 'devon@example.com' },
    { id: 'MEM-4920', name: 'Sarah Jenkins', tier: 'Silver', email: 'sarah.j@example.com' },
    { id: 'MEM-1002', name: 'Rajesh Sharma', tier: 'Gold', email: 'rajesh.sharma@example.com' },
    { id: 'MEM-1092', name: 'Marcus Finch (Expired)', tier: 'Expired', email: 'marcus.f@example.com' }
  ];

  const [selectedDemoId, setSelectedDemoId] = useState('MEM-8801');

  useEffect(() => {
    let isMounted = true;
    async function loadMemberProfile() {
      const targetId = user?.memberId || selectedDemoId;
      try {
        const mem = await getMemberById(targetId);
        if (isMounted && mem) {
          setCurrentMember(mem);
        }
      } catch {
        // Fallback demo member object
        if (isMounted) {
          const match = demoMembers.find((m) => m.id === targetId) || demoMembers[0];
          setCurrentMember({
            id: match.id,
            name: match.name,
            email: match.email,
            status: match.tier === 'Expired' ? 'expired' : 'active',
            activeMembership: {
              tier: match.tier,
              status: match.tier === 'Expired' ? 'expired' : 'active',
              courtPrivileges: match.tier === 'Gold' ? '100% complimentary standard court hours' : '50% discounted court booking rates'
            }
          });
        }
      }
    }
    loadMemberProfile();
    return () => { isMounted = false; };
  }, [user?.memberId, selectedDemoId]);

  const activeTier = currentMember?.activeMembership?.tier || 'Gold';
  const isGold = activeTier?.toLowerCase() === 'gold';

  return (
    <div className="py-10 space-y-12">
      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb / Nav */}
        <div className="flex items-center justify-between">
          <Link
            to="/courts"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#dfc99a] hover:text-[#f7f1e3] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Court Overview</span>
          </Link>

          {/* Member Switcher (useful for pair testing / role exploration) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#ede0c4]/60 hidden sm:inline">Active Player:</span>
            <select
              value={currentMember?.id || selectedDemoId}
              onChange={(e) => setSelectedDemoId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#041c14] border border-[#dfc99a]/30 text-xs text-white focus:outline-none focus:border-[#dfc99a]"
            >
              {demoMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.tier})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Hero Title Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border-[#dfc99a]/25">
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
              <Calendar className="w-3.5 h-3.5" />
              <span>Court Booking Concierge</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Reserve Your Championship Court
            </h1>

            <p className="text-xs sm:text-sm text-[#ede0c4]/80 max-w-2xl leading-relaxed">
              Book real-time slots across Centre Court Plexipave, European Red Clay, 
              Box Cricket Arenas, and Padel Alpha. 60-minute match play with 30-minute rolling starting intervals.
            </p>
          </div>

          {/* Member Status Badge Pill */}
          <div className="shrink-0 p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/25 space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#ede0c4]/60 tracking-wider">
                Member Tier
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-[#041c14] text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isGold ? (
                <Crown className="w-5 h-5 text-[#dfc99a]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-lg font-black text-white">{activeTier} Championship</span>
            </div>

            <span className="text-[11px] text-[#dfc99a] block font-semibold">
              {isGold ? '100% Free Court Hours' : '50% Discounted Member Rate'}
            </span>
          </div>
        </div>

        {/* Master Court Booking Panel */}
        <CourtBookingPanel member={currentMember} />
      </div>
    </div>
  );
}
