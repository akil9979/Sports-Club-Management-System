import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Home, Calendar } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center px-4 max-w-xl mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#dfc99a]/5">
        <Trophy className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-[#dfc99a]">Page Not Found</h2>
        <p className="text-sm text-[#ede0c4]/70">
          The court or page you are looking for has been moved or does not exist in our directory.
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/"
          className="btn-champagne inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm"
        >
          <Home className="w-4 h-4 text-[#02140e]" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/courts"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#041c14] text-[#ede0c4] border border-[#dfc99a]/25 hover:border-[#dfc99a]/50 text-xs sm:text-sm font-semibold transition-colors"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>View Court Availability</span>
        </Link>
      </div>
    </div>
  );
}
