import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Trophy, 
  Activity, 
  Layers, 
  Sun, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Crown,
  ChevronRight,
  Sparkles,
  ListOrdered
} from 'lucide-react';

import UsageIndicator from './UsageIndicator.jsx';
import SlotGrid from './SlotGrid.jsx';
import BookingSummaryModal from './BookingSummaryModal.jsx';
import MemberBookingsList from './MemberBookingsList.jsx';

import {
  getSports,
  getCourts,
  getCourtAvailability,
  getBookings,
  getMemberBookingUsage
} from '../../features/bookings/bookingApi.js';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function computeDateOptions() {
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const label = offset === 0 
      ? 'Today' 
      : offset === 1 
      ? 'Tomorrow' 
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return { dateStr, label };
  });
}

/**
 * CourtBookingPanel Component
 * Main Court Availability and Member Booking Experience.
 */
export default function CourtBookingPanel({ member = null, defaultSport = 'all' }) {
  // Navigation / View Tab
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my-bookings'

  // Data States
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState(defaultSport);

  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState('');

  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [availability, setAvailability] = useState(null);
  const [dailyUsage, setDailyUsage] = useState({ usedCount: 0, maxDaily: 2, remaining: 2, display: '0/2' });
  const [memberBookings, setMemberBookings] = useState([]);

  // Modal & Selection States
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Loading & Error States
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [courtError, setCourtError] = useState(null);
  const [slotError, setSlotError] = useState(null);

  const effectiveMember = member || {
    id: 'MEM-8801',
    name: 'Devon Conway',
    activeMembership: { tier: 'Gold', status: 'active' }
  };

  // Load sports & courts on mount
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      setLoadingCourts(true);
      setCourtError(null);
      try {
        const [sportsList, courtsList] = await Promise.all([
          getSports(),
          getCourts()
        ]);

        if (isMounted) {
          setSports(sportsList || []);
          setCourts(courtsList || []);
          if (courtsList && courtsList.length > 0) {
            setSelectedCourtId(courtsList[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load courts:', err);
          setCourtError('Could not load court facilities. Please check connection and retry.');
        }
      } finally {
        if (isMounted) setLoadingCourts(false);
      }
    }
    initData();
    return () => { isMounted = false; };
  }, []);

  // Fetch Member Daily Usage whenever date or member changes
  const fetchUsage = useCallback(async () => {
    if (!effectiveMember?.id) return;
    try {
      const usage = await getMemberBookingUsage(effectiveMember.id, selectedDate);
      setDailyUsage(usage);
    } catch (err) {
      console.warn('Failed to load usage:', err);
    }
  }, [effectiveMember?.id, selectedDate]);

  // Fetch Member Bookings List
  const fetchMemberBookings = useCallback(async () => {
    if (!effectiveMember?.id) return;
    setLoadingBookings(true);
    try {
      const list = await getBookings({ memberId: effectiveMember.id });
      setMemberBookings(list || []);
    } catch (err) {
      console.warn('Failed to load member bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [effectiveMember?.id]);

  useEffect(() => {
    fetchUsage();
    fetchMemberBookings();
  }, [fetchUsage, fetchMemberBookings]);

  // Fetch court availability slots whenever selectedCourtId or selectedDate changes
  const fetchSlots = useCallback(async () => {
    if (!selectedCourtId) return;
    setLoadingSlots(true);
    setSlotError(null);
    try {
      const data = await getCourtAvailability(selectedCourtId, selectedDate);
      setAvailability(data);
    } catch (err) {
      console.error('Failed to fetch slot availability:', err);
      setSlotError('Could not retrieve live court schedule for this date.');
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedCourtId, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Filter courts by selected sport
  const filteredCourts = courts.filter((c) => {
    if (!selectedSport || selectedSport === 'all') return true;
    const sId = c.sportId || c.sport_id;
    const sType = c.type?.toLowerCase();
    const target = selectedSport.toLowerCase();
    return sId === target || sType === target;
  });

  const activeCourt = courts.find((c) => c.id === selectedCourtId) || filteredCourts[0];
  const dateOptions = computeDateOptions();

  // Handle slot selection to trigger review & confirm modal
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  // On successful booking
  const handleBookingSuccess = (_newBooking) => {
    fetchSlots();
    fetchUsage();
    fetchMemberBookings();
  };

  // On cancellation
  const handleBookingCancelled = () => {
    fetchSlots();
    fetchUsage();
    fetchMemberBookings();
  };

  const dailyLimitReached = (dailyUsage?.usedCount ?? 0) >= 2;

  return (
    <div className="w-full space-y-8">
      {/* Top View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#dfc99a]/15 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'book'
                ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-lg shadow-[#dfc99a]/20'
                : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#041c14]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Book a Court</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'my-bookings'
                ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-lg shadow-[#dfc99a]/20'
                : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#041c14]'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>My Bookings ({memberBookings.filter(b => b.status === 'confirmed').length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchSlots();
            fetchUsage();
            fetchMemberBookings();
          }}
          className="p-2.5 rounded-xl bg-[#041c14] text-[#dfc99a] hover:text-white border border-[#dfc99a]/20 hover:border-[#dfc99a]/40 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Schedule"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* MEMBER DAILY USAGE INDICATOR (ALWAYS VISIBLE) */}
      <UsageIndicator
        usage={dailyUsage}
        member={effectiveMember}
        date={selectedDate}
      />

      {/* VIEW: MY BOOKINGS TAB */}
      {activeTab === 'my-bookings' && (
        <MemberBookingsList
          bookings={memberBookings}
          memberId={effectiveMember?.id}
          isLoading={loadingBookings}
          onBookingCancelled={handleBookingCancelled}
        />
      )}

      {/* VIEW: COURT AVAILABILITY & BOOKING TAB */}
      {activeTab === 'book' && (
        <div className="space-y-8">
          {/* 1. SPORT SELECTOR PILLS */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#dfc99a] uppercase tracking-wider block">
              1. Select Sport
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedSport('all')}
                className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  selectedSport === 'all'
                    ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] border-[#dfc99a] shadow-md shadow-[#dfc99a]/20'
                    : 'bg-[#041c14] text-[#ede0c4]/70 border-[#dfc99a]/15 hover:text-white hover:border-[#dfc99a]/35'
                }`}
              >
                All Sports ({courts.length})
              </button>

              {sports.map((sport) => {
                const isSelected = selectedSport?.toLowerCase() === sport.id?.toLowerCase() || selectedSport?.toLowerCase() === sport.name?.toLowerCase();
                const count = courts.filter(c => (c.sportId || c.sport_id) === sport.id || c.type?.toLowerCase() === sport.name?.toLowerCase()).length;

                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => {
                      setSelectedSport(sport.id);
                      // Switch active court to first matching court
                      const matching = courts.find(c => (c.sportId || c.sport_id) === sport.id || c.type?.toLowerCase() === sport.name?.toLowerCase());
                      if (matching) setSelectedCourtId(matching.id);
                    }}
                    className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] border-[#dfc99a] shadow-md shadow-[#dfc99a]/20'
                        : 'bg-[#041c14] text-[#ede0c4]/70 border-[#dfc99a]/15 hover:text-white hover:border-[#dfc99a]/35'
                    }`}
                  >
                    <span>{sport.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-[#02140e] text-[#dfc99a]' : 'bg-[#07261c] text-[#ede0c4]/60'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. COURT SELECTOR CARDS */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#dfc99a] uppercase tracking-wider block">
              2. Select Court Facility
            </span>

            {loadingCourts && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#031811] border border-[#dfc99a]/10 space-y-2 animate-pulse">
                    <div className="h-5 w-32 bg-[#07261c] rounded"></div>
                    <div className="h-4 w-48 bg-[#07261c] rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {!loadingCourts && courtError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {courtError}
              </div>
            )}

            {!loadingCourts && !courtError && filteredCourts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourts.map((court) => {
                  const isSelected = court.id === selectedCourtId;
                  const isGold = effectiveMember?.activeMembership?.tier?.toLowerCase() === 'gold';

                  return (
                    <div
                      key={court.id}
                      onClick={() => setSelectedCourtId(court.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'bg-[#041c14] border-[#dfc99a] ring-2 ring-[#dfc99a]/40 shadow-xl shadow-[#dfc99a]/10'
                          : 'bg-[#02140e] border-[#dfc99a]/15 hover:border-[#dfc99a]/40 hover:bg-[#031811]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-base font-bold text-white tracking-tight">{court.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                            {court.type}
                          </span>
                        </div>

                        <div className="text-xs text-[#ede0c4]/70 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{court.surface}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-[#dfc99a] shrink-0" />
                            <span className="truncate">{court.lighting}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Tier Card */}
                      <div className="pt-3 border-t border-[#dfc99a]/10 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-[#ede0c4]/60 uppercase block">Standard</span>
                          <span className="font-bold text-white">₹{court.hourlyRate}/hr</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#dfc99a] uppercase font-bold block">Your Member Rate</span>
                          {isGold ? (
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />
                              <span>100% Free</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-400">
                              ₹{court.memberRate || (court.hourlyRate * 0.5)}/hr
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. DATE SELECTOR PILLS & DATE PICKER */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#dfc99a] uppercase tracking-wider block">
              3. Select Play Date
            </span>

            <div className="p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {dateOptions.map(({ dateStr, label }) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-[#dfc99a] text-[#02140e] border-[#dfc99a] font-bold shadow-md'
                          : 'bg-[#02140e] text-[#ede0c4]/70 border-[#dfc99a]/15 hover:text-white hover:border-[#dfc99a]/35'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Native Date Picker */}
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs text-[#ede0c4]/60">Custom Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#02140e] text-xs text-[#ede0c4] border border-[#dfc99a]/25 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
            </div>
          </div>

          {/* 4. AVAILABLE SLOTS GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#dfc99a] uppercase tracking-wider block">
                4. Select 1-Hour Court Session
              </span>
              <span className="text-xs text-[#ede0c4]/70">
                Playing on: <strong className="text-white">{activeCourt?.name || 'Selected Court'}</strong>
              </span>
            </div>

            <SlotGrid
              slots={availability?.thirtyMinSlots || availability?.slots || []}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
              court={activeCourt}
              memberTier={effectiveMember?.activeMembership?.tier || 'Gold'}
              dailyLimitReached={dailyLimitReached}
              isLoading={loadingSlots}
              error={slotError}
              onRetry={fetchSlots}
            />
          </div>
        </div>
      )}

      {/* BOOKING SUMMARY & CONFIRMATION MODAL */}
      <BookingSummaryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        court={activeCourt}
        date={selectedDate}
        slot={selectedSlot}
        member={effectiveMember}
        dailyUsage={dailyUsage}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}
