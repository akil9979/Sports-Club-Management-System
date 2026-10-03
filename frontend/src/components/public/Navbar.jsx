import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { 
  Trophy, 
  Menu, 
  X, 
  Calendar, 
  ShieldCheck, 
  ShoppingBag, 
  PhoneCall, 
  ChevronRight,
  Sparkles,
  Clock,
  Users,
  LogIn,
  LogOut,
  Wine,
  Crown
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsOpen(false);

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Membership Tiers', path: '/membership', icon: Crown },
    { label: 'Member Roster', path: '/members', icon: Users },
    { label: 'Court Availability', path: '/courts', icon: Calendar },
    { label: 'Pro Shop & Workshop', path: '/shop', icon: ShoppingBag },
    { label: 'Trial & Concierge', path: '/enquiry', icon: PhoneCall },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top Announcement Bar - Emerald Ink & Champagne */}
      <div className="bg-gradient-to-r from-[#01100a] via-[#041c14] to-[#01100a] border-b border-[#dfc99a]/15 text-xs py-1.5 px-4 text-[#ede0c4]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-emerald-400 tracking-wide">Live Court Schedule Open</span>
            <span className="hidden sm:inline text-[#dfc99a]/40">•</span>
            <span className="hidden sm:inline text-[#f4efe4]/80">Championship Tennis, European Clay, Box Cricket & Padel</span>
          </div>
          <div className="flex items-center gap-4 text-[#ede0c4]/80">
            <div className="hidden md:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>Concierge Desk: 06:00 AM – 11:00 PM</span>
            </div>
            <Link 
              to="/enquiry" 
              className="text-[#dfc99a] hover:text-[#f7f1e3] font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors"
            >
              Complimentary Visitor Pass
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav 
        className={`w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-[#02140e]/95 backdrop-blur-md shadow-2xl border-b border-[#dfc99a]/20' 
            : 'bg-[#02140e]/80 backdrop-blur-sm border-b border-[#dfc99a]/12'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] p-0.5 shadow-lg shadow-[#dfc99a]/10 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full rounded-[10px] bg-[#02140e] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#dfc99a] stroke-[2.2]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                  THE CHAMPIONS <span className="champagne-gradient-text font-black">CLUB</span>
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest text-[#dfc99a]/80 uppercase font-bold">
                  Est. 2024 • Racquet & Country Club
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 bg-[#041c14]/80 p-1.5 rounded-full border border-[#dfc99a]/15 backdrop-blur-md">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 ${
                      active
                        ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/20 font-bold'
                        : 'text-[#ede0c4]/80 hover:text-white hover:bg-[#07261c]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Action CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Admin Portal Shortcut for Admin */}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 hover:bg-[#dfc99a]/25 transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#dfc99a]" />
                      <span>Admin Suite</span>
                    </Link>
                  )}

                  {/* Staff Portal Shortcut for Staff/Manager/Admin */}
                  {(user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin') && (
                    <Link
                      to="/staff/bar"
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition flex items-center gap-1.5"
                    >
                      <Wine className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bar & POS</span>
                    </Link>
                  )}

                  {/* Member Book Court Shortcut */}
                  <Link
                    to="/member/bookings"
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 hover:bg-[#dfc99a]/25 transition flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span>Book Court</span>
                  </Link>

                  {/* Authenticated User Chip */}
                  <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-[#041c14] border border-[#dfc99a]/20 rounded-full text-xs">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#dfc99a] to-[#c59e4b] text-[#02140e] font-black flex items-center justify-center text-[10px]">
                      {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-[#f4efe4] leading-tight text-xs">
                        {user?.firstName || 'Member'}
                      </span>
                      <span className="text-[9px] text-[#dfc99a] uppercase tracking-wider font-semibold leading-tight">
                        {user?.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-[#ede0c4]/60 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-semibold text-[#ede0c4] hover:text-white border border-[#dfc99a]/20 hover:border-[#dfc99a]/50 rounded-xl transition-colors flex items-center gap-1.5 bg-[#041c14]/60"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span>Member Sign In</span>
                  </Link>

                  <Link
                    to="/signup"
                    className="btn-champagne px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#87632b]" />
                    <span>Join Club</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl text-[#ede0c4] hover:text-white hover:bg-[#041c14] border border-[#dfc99a]/20 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#dfc99a]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-[#02140e]/98 border-b border-[#dfc99a]/20 px-4 pt-3 pb-6 space-y-2 backdrop-blur-2xl">
            {/* Authenticated user status in mobile drawer */}
            {isAuthenticated && (
              <div className="p-3 mb-3 rounded-2xl bg-[#041c14] border border-[#dfc99a]/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#dfc99a] text-[#02140e] font-bold flex items-center justify-center text-xs">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</div>
                    <div className="text-[10px] text-[#dfc99a] uppercase tracking-wider font-semibold">{user?.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {navLinks.map((link) => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30'
                      : 'text-[#ede0c4]/80 hover:bg-[#041c14] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className={`w-4 h-4 ${active ? 'text-[#dfc99a]' : 'text-slate-400'}`} />}
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#dfc99a]/50" />
                </Link>
              );
            })}

            <div className="pt-4 border-t border-[#dfc99a]/15 space-y-2">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#dfc99a]/10 border border-[#dfc99a]/30 text-[#dfc99a] font-bold text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#dfc99a]" />
                  <span>Admin Executive Control</span>
                </Link>
              )}

              {(user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin') && (
                <Link
                  to="/staff/bar"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs"
                >
                  <Wine className="w-4 h-4" />
                  <span>Open Staff POS Portal</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  to="/member/bookings"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#dfc99a]/15 border border-[#dfc99a]/35 text-[#dfc99a] font-bold text-xs"
                >
                  <Calendar className="w-4 h-4 text-[#dfc99a]" />
                  <span>Book Court Reservation</span>
                </Link>
              )}

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#041c14] border border-[#dfc99a]/20 text-[#ede0c4] font-semibold text-xs"
                  >
                    <LogIn className="w-4 h-4 text-[#dfc99a]" />
                    <span>Member Sign In</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className="btn-champagne w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs"
                  >
                    <Sparkles className="w-4 h-4 text-[#87632b]" />
                    <span>Create Club Account</span>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
