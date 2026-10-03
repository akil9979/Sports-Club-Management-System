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
    <div className="min-h-screen flex flex-col bg-[#02140e] text-[#f4efe4] selection:bg-[#dfc99a] selection:text-[#02140e]">
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
          className="hidden md:inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#041c14]/90 text-[#ede0c4] border border-[#dfc99a]/25 shadow-2xl backdrop-blur-md hover:bg-[#07261c] hover:border-[#dfc99a]/50 transition-all text-xs font-semibold"
          title="Check Live Court Availability"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Live Availability</span>
        </Link>
        <Link
          to="/enquiry"
          className="btn-champagne group inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm shadow-2xl"
          aria-label="Claim Free Trial Pass"
        >
          <Sparkles className="w-4 h-4 text-[#87632b] group-hover:rotate-12 transition-transform" />
          <span>Book Free Trial</span>
        </Link>
      </div>

      {/* Public Footer */}
      <Footer />
    </div>
  );
}
