import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  XCircle, 
  AlertCircle, 
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Crown
} from 'lucide-react';
import { getCourts, getCourtAvailability } from '../../services/api.js';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function computeDateOptions() {
  return [0, 1, 2, 3, 4].map((offset) => {
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

export default function CourtAvailabilitySection({ embedded = false }) {
  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [availability, setAvailability] = useState(null);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [courtError, setCourtError] = useState(null);
  const [slotsError, setSlotsError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // all | morning | afternoon | evening

  // Fetch courts on mount
  const fetchCourts = async () => {
    setLoadingCourts(true);
    setCourtError(null);
    try {
      const data = await getCourts();
      setCourts(data || []);
      if (data && data.length > 0) {
        setSelectedCourtId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching courts:', err);
      setCourtError('Could not load court facilities. Please check connection and retry.');
    } finally {
      setLoadingCourts(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  // Fetch slots whenever selectedCourtId or selectedDate changes
  useEffect(() => {
    if (!selectedCourtId) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSlotsError(null);
      try {
        const data = await getCourtAvailability(selectedCourtId, selectedDate);
        if (isMounted) {
          setAvailability(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching availability:', err);
          setSlotsError('Could not fetch real-time slot schedule for this date.');
        }
      } finally {
        if (isMounted) {
          setLoadingSlots(false);
        }
      }
    };

    fetchSlots();
    return () => { isMounted = false; };
  }, [selectedCourtId, selectedDate]);

  const activeCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];
  const dateOptions = computeDateOptions();

  // Filter slots
  const filteredSlots = availability?.slots?.filter((slot) => {
    if (timeFilter === 'all') return true;
    const hour = parseInt(slot.time.split(':')[0], 10);
    if (timeFilter === 'morning') return hour < 12;
    if (timeFilter === 'afternoon') return hour >= 12 && hour < 17;
    if (timeFilter === 'evening') return hour >= 17;
    return true;
  }) || [];

  return (
    <section id="courts-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-[#02140e]/60 border-t border-[#dfc99a]/15'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
            <span>Championship Schedule</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Real-Time Court Availability
          </h2>
          <p className="text-[#ede0c4]/80 text-sm sm:text-base leading-relaxed">
            Live schedule for Centre Court Plexipave, French Red Clay, Box Cricket arenas, 
            and Panoramic Padel with guaranteed reservation locking.
          </p>
        </div>

        {/* LOADING COURTS STATE */}
        {loadingCourts && (
          <div className="glass-panel p-8 rounded-2xl max-w-xl mx-auto text-center space-y-4 animate-pulse">
            <div className="h-6 w-48 bg-[#06261b] rounded mx-auto"></div>
            <div className="h-10 w-full bg-[#06261b] rounded-xl"></div>
          </div>
        )}

        {/* COURTS ERROR STATE */}
        {!loadingCourts && courtError && (
          <div className="glass-panel p-6 rounded-2xl max-w-md mx-auto text-center space-y-4 border-rose-800/40">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-300">{courtError}</p>
            <button
              onClick={fetchCourts}
              className="px-4 py-2 bg-[#06261b] text-white rounded-xl text-xs font-semibold hover:bg-[#0a3425]"
            >
              Retry Loading Courts
            </button>
          </div>
        )}

        {/* MAIN COURT INTERACTION VIEW */}
        {!loadingCourts && !courtError && courts.length > 0 && (
          <div className="space-y-8">
            {/* Court Selector Pills */}
            <div className="flex items-center justify-start sm:justify-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {courts.map((court) => {
                const active = court.id === selectedCourtId;
                return (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourtId(court.id)}
                    className={`shrink-0 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-2.5 ${
                      active
                        ? 'bg-gradient-to-r from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] text-[#02140e] border-[#dfc99a] shadow-lg shadow-[#dfc99a]/20'
                        : 'bg-[#041c14] text-[#ede0c4]/80 border-[#dfc99a]/15 hover:border-[#dfc99a]/40 hover:text-white'
                    }`}
                  >
                    <span>{court.name}</span>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-extrabold ${
                      active ? 'bg-[#02140e] text-[#dfc99a]' : 'bg-[#07261c] text-[#dfc99a]/80'
                    }`}>
                      {court.type}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Court Specs Header */}
            {activeCourt && (
              <div className="glass-panel p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {activeCourt.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                      {activeCourt.type}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#ede0c4]/80 max-w-2xl leading-relaxed">
                    {activeCourt.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#ede0c4]/70">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Surface: <strong className="text-[#f4efe4]">{activeCourt.surface}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      Lighting: <strong className="text-[#f4efe4]">{activeCourt.lighting}</strong>
                    </span>
                    <span>•</span>
                    <span>Max: <strong className="text-[#f4efe4]">{activeCourt.maxPlayers} players</strong></span>
                  </div>
                </div>

                {/* Rate Card Preview */}
                <div className="shrink-0 flex items-center gap-4 bg-[#02140e] p-4 rounded-2xl border border-[#dfc99a]/20">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-[#ede0c4]/60 font-semibold">Standard Guest Rate</div>
                    <div className="text-lg font-bold text-white">₹{activeCourt.hourlyRate}/hr</div>
                  </div>
                  <div className="h-8 w-px bg-[#dfc99a]/20" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-[#dfc99a] font-bold">Gold Tier</div>
                    <div className="text-lg font-extrabold text-[#dfc99a]">100% INCLUDED</div>
                  </div>
                </div>
              </div>
            )}

            {/* Date Picker Bar & Filter Controls */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Date Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                {dateOptions.map(({ dateStr, label }) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/60 font-bold shadow-md'
                          : 'bg-[#041c14] text-[#ede0c4]/70 border border-[#dfc99a]/12 hover:text-white hover:border-[#dfc99a]/30'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#041c14] text-xs text-[#ede0c4] border border-[#dfc99a]/20 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              {/* Time Period Filter */}
              <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
                <span className="text-xs text-[#ede0c4]/60 hidden sm:inline mr-2">Filter:</span>
                {[
                  { id: 'all', label: 'All Sessions' },
                  { id: 'morning', label: 'Morning' },
                  { id: 'afternoon', label: 'Afternoon' },
                  { id: 'evening', label: 'Evening' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTimeFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      timeFilter === filter.id
                        ? 'bg-[#dfc99a] text-[#02140e] font-bold shadow'
                        : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#041c14]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SLOTS GRID */}
            <div className="space-y-4">
              {/* SLOTS LOADING STATE */}
              {loadingSlots && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="glass-panel p-4 rounded-2xl space-y-3 animate-pulse">
                      <div className="h-4 w-28 bg-[#06261b] rounded"></div>
                      <div className="h-6 w-20 bg-[#06261b] rounded-md"></div>
                      <div className="h-9 w-full bg-[#06261b] rounded-xl"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* SLOTS ERROR STATE */}
              {!loadingSlots && slotsError && (
                <div className="glass-panel p-6 rounded-2xl text-center space-y-3 border-rose-800/40 max-w-md mx-auto">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-sm text-rose-300">{slotsError}</p>
                  <button
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className="px-4 py-2 bg-[#06261b] text-xs font-semibold text-white rounded-xl"
                  >
                    Reset to Today
                  </button>
                </div>
              )}

              {/* EMPTY SLOTS STATE */}
              {!loadingSlots && !slotsError && filteredSlots.length === 0 && (
                <div className="glass-panel p-8 rounded-2xl text-center space-y-3 max-w-lg mx-auto">
                  <Clock className="w-10 h-10 text-[#dfc99a]/40 mx-auto" />
                  <h4 className="text-white font-bold text-base">No Sessions Matching Filter</h4>
                  <p className="text-xs text-[#ede0c4]/70">
                    All court slots in this period are either fully reserved or offline for maintenance.
                  </p>
                  <button
                    onClick={() => setTimeFilter('all')}
                    className="px-4 py-2 bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 rounded-xl text-xs font-bold hover:bg-[#dfc99a]/25"
                  >
                    View All Sessions
                  </button>
                </div>
              )}

              {/* REAL SLOTS LIST */}
              {!loadingSlots && !slotsError && filteredSlots.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSlots.map((slot) => {
                    const isAvailable = slot.available;
                    const isSocial = slot.status?.toLowerCase().includes('social');

                    return (
                      <div
                        key={slot.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isAvailable
                            ? 'glass-panel border-emerald-500/30 hover:border-[#dfc99a]/60 hover:shadow-lg hover:shadow-emerald-500/10'
                            : isSocial
                            ? 'glass-panel border-[#dfc99a]/40 bg-[#dfc99a]/5'
                            : 'bg-[#02140e]/70 border-[#dfc99a]/10 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${isAvailable ? 'text-emerald-400' : 'text-[#ede0c4]/40'}`} />
                            <span className="text-sm font-bold text-white tracking-tight">
                              {slot.time}
                            </span>
                          </div>

                          {slot.isPrime && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 uppercase tracking-wider">
                              Prime Slot
                            </span>
                          )}
                        </div>

                        {/* Status Label */}
                        <div className="mb-4">
                          {isAvailable ? (
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                Available
                              </span>
                              <span className="text-xs font-bold text-[#ede0c4]">
                                ₹{slot.rate}/hr
                              </span>
                            </div>
                          ) : isSocial ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#dfc99a]">
                              <Users className="w-3.5 h-3.5" />
                              <span>Club Mixer Session</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#ede0c4]/50">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reserved by Member</span>
                            </div>
                          )}
                        </div>

                        {/* Action CTA */}
                        {isAvailable ? (
                          <Link
                            to={`/member/bookings?courtId=${encodeURIComponent(activeCourt.id)}&date=${encodeURIComponent(selectedDate)}`}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] hover:from-[#fcfaf5] hover:to-[#ede0c4] text-[#02140e] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <span>Hold / Reserve Slot</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#02140e]" />
                          </Link>
                        ) : isSocial ? (
                          <Link
                            to={`/enquiry?intent=social_play&date=${selectedDate}`}
                            className="w-full py-2 px-3 rounded-xl bg-[#dfc99a]/20 hover:bg-[#dfc99a]/30 text-[#dfc99a] border border-[#dfc99a]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Join Mixer (Open)</span>
                          </Link>
                        ) : (
                          <div className="w-full py-2 text-center text-xs font-medium text-[#ede0c4]/40 bg-[#041c14] rounded-xl cursor-not-allowed">
                            Reserved
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Club Policy Callout */}
            <div className="p-5 rounded-2xl bg-[#041c14] border border-[#dfc99a]/20 text-xs text-[#ede0c4]/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[#f4efe4] font-medium">
                <ShieldAlert className="w-4 h-4 text-[#dfc99a] shrink-0" />
                <span>Session Policy: 60-min tournament sessions • 30-min rolling interval • Max 2 sessions/day per member.</span>
              </div>
              <div className="text-[#dfc99a] font-bold">
                Gold Tier Members: 100% Complimentary Court Time
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
