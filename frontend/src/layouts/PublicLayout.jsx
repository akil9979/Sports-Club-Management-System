import React, { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from '../components/public/Navbar.jsx';
import Footer from '../components/public/Footer.jsx';
import { Sparkles, Calendar } from 'lucide-react';

export default function PublicLayout() {
  const { pathname } = useLocation();

  // Scroll to top upon navigating to a new route
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Floating Action Buttons for High Conversion on Mobile/Desktop */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <Link
          to="/courts"
          className="hidden md:inline-flex items-center gap-2 px-4 py-3 rounded-full bg-slate-900/90 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md hover:bg-slate-800 transition-all text-xs font-semibold"
          title="Check Live Court Availability"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Live Availability</span>
        </Link>
        <Link
          to="/enquiry"
          className="group inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Claim Free Trial Pass"
        >
          <Sparkles className="w-4 h-4 text-amber-900 group-hover:rotate-12 transition-transform" />
          <span>Book Free Trial</span>
        </Link>
      </div>

      {/* Public Footer */}
      <Footer />
    </div>
  );
}
