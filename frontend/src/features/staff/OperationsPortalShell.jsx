import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Wine,
  Flame,
  Receipt,
  Lock,
  ChevronDown,
  ArrowLeft,
  LogOut
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Locked Terminal Screen Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Terminal Locked</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter staff PIN for <span className="text-emerald-400 font-semibold">{currentStaff.name}</span>
              </p>
            </div>

            {/* PIN Dots Indicator */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    pinInput.length > idx
                      ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                      : 'bg-slate-800 border border-slate-700'
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
                  className="py-3.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-lg font-bold font-mono transition active:scale-95 border border-slate-700/50"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 bg-slate-800/40 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold uppercase transition active:scale-95"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-3.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-lg font-bold font-mono transition active:scale-95 border border-slate-700/50"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinSubmit}
                className="py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold uppercase transition active:scale-95 shadow-md shadow-emerald-500/20"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Operations Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/90 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Portal Identification */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Return to Public Club Site"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-sm">
                CC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-white tracking-wide">
                    CHAMPIONS CLUB
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    Staff Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Operations & Bar POS Terminal
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Live Clock & Shift Duration */}
          <div className="hidden md:flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 px-4 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-semibold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="text-slate-400">
              Shift: <span className="text-slate-200 font-mono font-medium">{shiftStart} - Ongoing</span>
            </div>
          </div>

          {/* Right: Authenticated Staff Switcher & Quick Lock */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setStaffDropdownOpen(!staffDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                  {currentStaff.avatar}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {currentStaff.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {currentStaff.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Staff Switcher Dropdown */}
              {staffDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-[10px] text-slate-400">{member.role}</div>
                      </div>
                      <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        PIN: {member.pin}
                      </span>
                    </button>
                  ))}
                  <div className="pt-1 mt-1 border-t border-slate-800">
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

            {/* Lock Terminal Button */}
            <button
              type="button"
              onClick={lockTerminal}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 border border-slate-700/60 transition"
              title="Lock Terminal Screen"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handlePortalLogout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-700/60 transition"
              title="Sign Out of Operations Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation for Operations Workspaces */}
        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/60 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => onTabChange && onTabChange('pos')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'pos'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            Bar POS & Tables
          </button>

          <button
            onClick={() => onTabChange && onTabChange('kds')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'kds'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Kitchen Display (KDS)
          </button>

          <button
            onClick={() => onTabChange && onTabChange('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'audit'
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Settled Tabs Audit
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
