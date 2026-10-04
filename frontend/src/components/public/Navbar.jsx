import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Sparkles,
  Clock,
  Users,
  LogIn,
  LogOut,
  Wine,
  Crown,
  Building2,
  QrCode,
  User
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [portalsDropdownOpen, setPortalsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, can } = useAuth();
  const dropdownRef = useRef(null);

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

  // Close dropdowns on route changes
  useEffect(() => {
    setIsOpen(false);
    setPortalsDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for portals dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setPortalsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top Announcement Bar - Emerald Ink & Champagne */}
      <div className="bg-gradient-to-r from-[#01100a] via-[#041c14] to-[#01100a] border-b border-[#dfc99a]/15 text-xs py-1.5 px-3 sm:px-4 text-[#ede0c4]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-emerald-400 tracking-wide text-[11px] sm:text-xs">Live Court Schedule Open</span>
            <span className="hidden md:inline text-[#dfc99a]/40">•</span>
            <span className="hidden md:inline text-[#f4efe4]/80 text-[11px] sm:text-xs">Championship Tennis, European Clay, Box Cricket & Padel</span>
          </div>
          <div className="flex items-center gap-4 text-[#ede0c4]/80">
            <div className="hidden lg:flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>Concierge Desk: 06:00 AM – 11:00 PM</span>
            </div>
            <Link 
              to="/enquiry" 
              className="text-[#dfc99a] hover:text-[#f7f1e3] font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors text-[11px] sm:text-xs shrink-0"
            >
              Complimentary Pass
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav 
        className={`w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-[#02140e]/95 backdrop-blur-md shadow-2xl border-b border-[#dfc99a]/20' 
            : 'bg-[#02140e]/85 backdrop-blur-sm border-b border-[#dfc99a]/12'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] p-0.5 shadow-lg shadow-[#dfc99a]/10 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full rounded-[10px] bg-[#02140e] flex items-center justify-center">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#dfc99a] stroke-[2.2]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg lg:text-xl tracking-tight text-white flex items-center gap-1">
                  THE CHAMPIONS <span className="champagne-gradient-text font-black">CLUB</span>
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-widest text-[#dfc99a]/80 uppercase font-bold">
                  Est. 2024 • Racquet & Country Club
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Visible on XL screens to prevent crowding) */}
            <div className="hidden xl:flex items-center gap-1 bg-[#041c14]/80 p-1.5 rounded-full border border-[#dfc99a]/15 backdrop-blur-md">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
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
            <div className="hidden md:flex items-center gap-2 sm:gap-2.5">
              {isAuthenticated ? (
                <>
                  {/* Consolidated Staff Portals Dropdown for Staff/Manager/Admin */}
                  {isStaffOrAdmin && (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setPortalsDropdownOpen(!portalsDropdownOpen)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 hover:bg-[#dfc99a]/25 transition flex items-center gap-1.5"
                        aria-expanded={portalsDropdownOpen}
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#dfc99a]" />
                        <span>Staff Portals</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalsDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {portalsDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-[#041c14] border border-[#dfc99a]/30 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in duration-150 space-y-1">
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 border-b border-emerald-900/50 mb-1">
                            Operations & Management
                          </div>

                          {user?.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setPortalsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#dfc99a] hover:bg-[#dfc99a]/15 transition"
                            >
                              <ShieldCheck className="w-4 h-4 text-[#dfc99a] shrink-0" />
                              <div>
                                <div className="font-bold">Admin Executive Suite</div>
                                <div className="text-[10px] text-emerald-400/70">Roles & system controls</div>
                              </div>
                            </Link>
                          )}

                          {(user?.role === 'admin' || can('members.view') || can('bookings.view')) && (
                            <Link
                              to="/staff/verification"
                              onClick={() => setPortalsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#ede0c4] hover:text-white hover:bg-[#07261c] transition"
                            >
                              <QrCode className="w-4 h-4 text-[#dfc99a] shrink-0" />
                              <div>
                                <div className="font-bold">Frontdesk Verification</div>
                                <div className="text-[10px] text-emerald-400/70">QR barcode terminal & check-in</div>
                              </div>
                            </Link>
                          )}

                          {(user?.role === 'admin' || can('bar_orders.view')) && (
                            <Link
                              to="/staff/bar"
                              onClick={() => setPortalsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-950/50 transition"
                            >
                              <Wine className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div>
                                <div className="font-bold">Bar POS & Tables</div>
                                <div className="text-[10px] text-emerald-400/70">Running tabs & orders</div>
                              </div>
                            </Link>
                          )}

                          {(user?.role === 'admin' || can('products.view') || can('inventory.view')) && (
                            <Link
                              to="/staff/shop"
                              onClick={() => setPortalsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#ede0c4] hover:text-white hover:bg-[#07261c] transition"
                            >
                              <ShoppingBag className="w-4 h-4 text-[#dfc99a] shrink-0" />
                              <div>
                                <div className="font-bold">Pro Shop & Inventory</div>
                                <div className="text-[10px] text-emerald-400/70">Commercial catalogue & stocks</div>
                              </div>
                            </Link>
                          )}

                          {(user?.role === 'admin' || can('expenses.view')) && (
                            <Link
                              to="/management"
                              onClick={() => setPortalsDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#ede0c4] hover:text-white hover:bg-[#07261c] transition"
                            >
                              <Building2 className="w-4 h-4 text-[#dfc99a] shrink-0" />
                              <div>
                                <div className="font-bold">Management Command</div>
                                <div className="text-[10px] text-emerald-400/70">Revenue KPIs & shifts</div>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Book Court Shortcut */}
                  <Link
                    to="/member/bookings"
                    className="hidden lg:flex px-3 py-1.5 text-xs font-bold rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 hover:bg-[#dfc99a]/25 transition items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span>Book Court</span>
                  </Link>

                  {/* Authenticated User Chip */}
                  <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-[#041c14] border border-[#dfc99a]/20 rounded-full text-xs">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#dfc99a] to-[#c59e4b] text-[#02140e] font-black flex items-center justify-center text-[10px] shrink-0">
                      {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-[#f4efe4] leading-tight text-xs truncate max-w-[90px] sm:max-w-[120px]">
                        {user?.firstName || 'Member'}
                      </span>
                      <span className="text-[8px] text-[#dfc99a] uppercase tracking-wider font-semibold leading-tight">
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
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#ede0c4] hover:text-white border border-[#dfc99a]/20 hover:border-[#dfc99a]/50 rounded-xl transition-colors flex items-center gap-1.5 bg-[#041c14]/60 whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span>Member Sign In</span>
                  </Link>

                  <Link
                    to="/signup"
                    className="btn-champagne px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#87632b]" />
                    <span>Join Club</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button (Active on < XL screens) */}
            <div className="flex xl:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 sm:p-2.5 rounded-xl text-[#ede0c4] hover:text-white hover:bg-[#041c14] border border-[#dfc99a]/20 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-[#dfc99a]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="xl:hidden bg-[#02140e]/98 border-b border-[#dfc99a]/20 px-4 pt-3 pb-6 space-y-2 backdrop-blur-2xl max-h-[85vh] overflow-y-auto">
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
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
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

            <div className="pt-3 border-t border-[#dfc99a]/15 space-y-2">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dfc99a]/10 border border-[#dfc99a]/30 text-[#dfc99a] font-bold text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#dfc99a]" />
                  <span>Admin Executive Control</span>
                </Link>
              )}

              {isStaffOrAdmin && (
                <>
                  {(user?.role === 'admin' || can('members.view') || can('bookings.view')) && (
                    <Link
                      to="/staff/verification"
                      onClick={closeMobileMenu}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dfc99a]/15 border border-[#dfc99a]/35 text-[#dfc99a] font-bold text-xs"
                    >
                      <QrCode className="w-4 h-4 text-[#dfc99a]" />
                      <span>Frontdesk QR Verification</span>
                    </Link>
                  )}

                  {(user?.role === 'admin' || can('bar_orders.view')) && (
                    <Link
                      to="/staff/bar"
                      onClick={closeMobileMenu}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs"
                    >
                      <Wine className="w-4 h-4" />
                      <span>Open Staff POS Portal</span>
                    </Link>
                  )}

                  {(user?.role === 'admin' || can('products.view') || can('inventory.view')) && (
                    <Link
                      to="/staff/shop"
                      onClick={closeMobileMenu}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dfc99a]/15 border border-[#dfc99a]/35 text-[#dfc99a] font-bold text-xs"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#dfc99a]" />
                      <span>Pro Shop & Inventory</span>
                    </Link>
                  )}

                  {(user?.role === 'admin' || can('expenses.view')) && (
                    <Link
                      to="/management"
                      onClick={closeMobileMenu}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dfc99a]/15 border border-[#dfc99a]/35 text-[#dfc99a] font-bold text-xs"
                    >
                      <Building2 className="w-4 h-4 text-[#dfc99a]" />
                      <span>Management Dashboard</span>
                    </Link>
                  )}
                </>
              )}

              {isAuthenticated && (
                <Link
                  to="/member/bookings"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dfc99a]/15 border border-[#dfc99a]/35 text-[#dfc99a] font-bold text-xs"
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

