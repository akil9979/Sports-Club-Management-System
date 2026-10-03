import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Home, Calendar } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center px-4 max-w-xl mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
        <Trophy className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
        <p className="text-sm text-slate-400">
          The court or page you are looking for has been moved or does not exist.
        </p>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/courts"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:text-white text-sm font-semibold transition-colors"
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>View Court Availability</span>
        </Link>
      </div>
    </div>
  );
}
