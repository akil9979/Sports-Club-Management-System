import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Wine,
  Flame,
  Receipt,
  Users,
  Lock,
  ChevronDown,
  ArrowLeft,
  LogOut,
  Building2
} from 'lucide-react';
import { useStaffAuth } from './StaffAuthContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function OperationsPortalShell({ children, activeTab, onTabChange }) {
  const navigate = useNavigate();
  const { currentStaff, staffList, isLocked, shiftStart, switchStaff, lockTerminal, unlockTerminal } = useStaffAuth();
  const { logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);

  const handlePortalLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePinSubmit = (e) => {
    e?.preventDefault();
    const success = unlockTerminal(pinInput);
    if (!success) {
      setPinError(true);
      setPinInput('');
    } else {
      setPinError(false);
      setPinInput('');
    }
  };

  const handleKeypadPress = (val) => {
    if (pinInput.length < 4) {
      const next = pinInput + val;
      setPinInput(next);
      if (next.length === 4) {
        const success = unlockTerminal(next);
        if (!success) {
          setPinError(true);
          setPinInput('');
        } else {
          setPinError(false);
          setPinInput('');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#02140e] text-slate-100 flex flex-col font-sans selection:bg-[#dfc99a] selection:text-[#02140e]">
      {/* Locked Terminal Screen Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-[#02140e]/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#041c14] border border-emerald-900/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 bg-[#07261c] border border-[#dfc99a]/30 text-[#dfc99a] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-serif font-bold text-[#fcfaf5]">Terminal Locked</h3>
              <p className="text-xs text-emerald-300/70 mt-1">
                Enter staff PIN for <span className="text-[#dfc99a] font-semibold">{currentStaff.name}</span>
              </p>
            </div>

            {/* PIN Dots Indicator */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    pinInput.length > idx
                      ? 'bg-[#dfc99a] scale-110 shadow-sm shadow-[#dfc99a]/50'
                      : 'bg-[#02140e] border border-emerald-900/60'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 font-medium animate-bounce">
                Incorrect PIN. Default demo PIN: {currentStaff.pin}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="py-3.5 bg-[#07261c] hover:bg-[#0b3829] text-white rounded-xl text-lg font-bold font-mono transition active:scale-95 border border-emerald-800/60"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 bg-[#07261c]/40 hover:bg-[#07261c] text-emerald-400/70 rounded-xl text-xs font-semibold uppercase transition active:scale-95 border border-emerald-900/50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3.5 bg-[#07261c] hover:bg-[#0b3829] text-white rounded-xl text-lg font-bold font-mono transition active:scale-95 border border-emerald-800/60"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinSubmit}
                className="py-3.5 btn-champagne rounded-xl text-xs font-bold uppercase transition active:scale-95 shadow-md shadow-[#dfc99a]/15"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Operations Header */}
      <header className="bg-[#041c14]/90 border-b border-emerald-900/40 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Portal Identification */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-lg bg-[#07261c] hover:bg-[#0b3829] text-emerald-300 hover:text-white transition border border-emerald-800/60"
              title="Return to Public Club Site"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] flex items-center justify-center font-bold text-sm shadow-sm">
                CC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-serif font-bold text-[#fcfaf5] tracking-wide">
                    CHAMPIONS CLUB
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 uppercase tracking-wider">
                    Staff Portal
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400/70">
                  Operations & Bar POS Terminal
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Live Clock & Shift Duration */}
          <div className="hidden md:flex items-center gap-4 bg-[#02140e]/80 border border-emerald-900/50 px-4 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100">
              <Clock className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span className="font-mono font-semibold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-emerald-800">|</span>
            <div className="text-emerald-300/70">
              Shift: <span className="text-emerald-100 font-mono font-medium">{shiftStart} - Ongoing</span>
            </div>
          </div>

          {/* Right: Authenticated Staff Switcher & Quick Lock */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setStaffDropdownOpen(!staffDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 bg-[#07261c] hover:bg-[#0b3829] border border-emerald-800/60 rounded-xl transition"
              >
                <div className="w-7 h-7 rounded-lg bg-[#dfc99a]/20 text-[#dfc99a] font-bold text-xs flex items-center justify-center border border-[#dfc99a]/30">
                  {currentStaff.avatar}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-[#fcfaf5] leading-tight">
                    {currentStaff.name}
                  </div>
                  <div className="text-[10px] text-emerald-400/70 leading-tight">
                    {currentStaff.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400/70" />
              </button>

              {/* Staff Switcher Dropdown */}
              {staffDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#041c14] border border-emerald-900/50 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-emerald-900/40 text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wider">
                    Switch Active Staff Shift
                  </div>
                  {staffList.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        switchStaff(member.id);
                        setStaffDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition ${
                        currentStaff.id === member.id
                          ? 'bg-[#dfc99a]/15 text-[#dfc99a]'
                          : 'text-emerald-200 hover:bg-[#07261c]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-[10px] text-emerald-400/70">{member.role}</div>
                      </div>
                      <span className="text-[9px] font-mono bg-[#02140e] px-1.5 py-0.5 rounded text-emerald-300/80 border border-emerald-900/50">
                        PIN: {member.pin}
                      </span>
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-emerald-900/40">
                    <button
                      type="button"
                      onClick={handlePortalLogout}
                      className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-medium transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Management Dashboard Button */}
            <Link
              to="/management"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07261c] hover:bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/25 text-xs font-semibold transition"
              title="Open Management & Executive Dashboard"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Management</span>
            </Link>

            {/* Lock Terminal Button */}
            <button
              type="button"
              onClick={lockTerminal}
              className="p-2 rounded-xl bg-[#07261c] hover:bg-[#dfc99a]/20 hover:text-[#dfc99a] text-emerald-300 border border-emerald-800/60 transition"
              title="Lock Terminal Screen"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handlePortalLogout}
              className="p-2 rounded-xl bg-[#07261c] hover:bg-rose-500/20 hover:text-rose-300 text-emerald-300 border border-emerald-800/60 transition"
              title="Sign Out of Operations Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation for Operations Workspaces */}
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-emerald-900/40 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => onTabChange && onTabChange('pos')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'pos'
                ? 'btn-champagne font-bold shadow-md shadow-[#dfc99a]/10'
                : 'text-emerald-300/70 hover:text-white hover:bg-[#07261c]/50'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            Bar POS & Tables
          </button>

          <button
            onClick={() => onTabChange && onTabChange('kds')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'kds'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/10'
                : 'text-emerald-300/70 hover:text-white hover:bg-[#07261c]/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Kitchen Display (KDS)
          </button>

          <button
            onClick={() => onTabChange && onTabChange('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'audit'
                ? 'bg-[#dfc99a] text-[#02140e] font-bold shadow-md shadow-[#dfc99a]/10'
                : 'text-emerald-300/70 hover:text-white hover:bg-[#07261c]/50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Settled Tabs Audit
          </button>

          <button
            onClick={() => onTabChange && onTabChange('crm')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'crm'
                ? 'btn-champagne font-bold shadow-md shadow-[#dfc99a]/10'
                : 'text-emerald-300/70 hover:text-white hover:bg-[#07261c]/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Enquiries & CRM Leads
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
