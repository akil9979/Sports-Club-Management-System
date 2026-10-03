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
  Wine
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
    { label: 'Home', path: '/' },
    { label: 'Plans & Pricing', path: '/membership', icon: ShieldCheck },
    { label: 'Member Desk', path: '/members', icon: Users },
    { label: 'Court Availability', path: '/courts', icon: Calendar },
    { label: 'Pro Shop', path: '/shop', icon: ShoppingBag },
    { label: 'Enquiry & Trial', path: '/enquiry', icon: PhoneCall },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/20 text-xs py-1.5 px-4 text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-400">Live Slots Available Today</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">Tennis, Box Cricket & Padel Courts Open Till 11:00 PM</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 hidden md:flex">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Front Desk: 06:00 AM – 11:00 PM</span>
            </div>
            <Link 
              to="/enquiry" 
              className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 flex items-center gap-1"
            >
              First Visit? Get Free Trial Pass
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav 
        className={`w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-slate-950/90 backdrop-blur-md shadow-xl border-b border-slate-800' 
            : 'bg-slate-950/75 backdrop-blur-sm border-b border-slate-800/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Trophy className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                  THE CHAMPIONS <span className="text-emerald-400">CLUB</span>
                </span>
                <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                  Tennis • Cricket • Padel • Lounge
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      active
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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
                  {/* Staff Portal Shortcut for Staff/Manager/Admin */}
                  {(user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin') && (
                    <Link
                      to="/staff/bar"
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
                    >
                      <Wine className="w-3.5 h-3.5" />
                      <span>Staff Portal</span>
                    </Link>
                  )}

                  {/* Authenticated User Chip */}
                  <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] border border-emerald-500/30">
                      {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-white leading-tight">
                        {user?.firstName || 'Member'}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-tight">
                        {user?.role || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                    title="Sign Out of Champions Club"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    to="/signup"
                    className="relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-lg font-medium group transition-all duration-200"
                  >
                    <span className="w-full h-full bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 group-hover:from-emerald-300 group-hover:to-teal-400 absolute"></span>
                    <span className="relative px-4 py-2 text-sm transition-all ease-out bg-slate-950 rounded-[7px] group-hover:bg-opacity-0 font-semibold text-emerald-300 group-hover:text-slate-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 group-hover:text-slate-950" />
                      <span>Join Club</span>
                    </span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 backdrop-blur-xl">
            {/* Authenticated user status in mobile drawer */}
            {isAuthenticated && (
              <div className="p-3 mb-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{user?.firstName} {user?.lastName}</div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider">{user?.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1"
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
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />}
                    <span>{link.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              );
            })}

            <div className="pt-4 border-t border-slate-800 space-y-2">
              {(user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin') && (
                <Link
                  to="/staff/bar"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold"
                >
                  <Wine className="w-4 h-4" />
                  <span>Open Staff Portal</span>
                </Link>
              )}

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-medium"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Sign In to Account</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                  >
                    <Sparkles className="w-4 h-4 text-amber-900" />
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
