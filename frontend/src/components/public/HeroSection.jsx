import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Flame, 
  ChevronDown 
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background Glows & Accent Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium shadow-inner shadow-emerald-500/10 animate-pulse">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>Welcome to The Digital Era of Sports Clubs</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">No More WhatsApp Chaos</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Elevate Your Game at <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
              The Champions Club
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Experience tournament-grade Plexipave tennis, floodlit box cricket arenas, 
            panoramic glass padel, and an in-house pro gear shop. Transparent membership plans, 
            instant court availability, and zero double-booking hassle.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/enquiry"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-5 h-5 text-amber-950" />
              <span>Claim Your Free Trial Pass</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>

            <Link
              to="/courts"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-base font-semibold transition-all hover:border-slate-600"
            >
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Check Live Court Slots</span>
            </Link>
          </div>

          {/* Feature Highlights Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Double-Booking Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Member Discounts on Pro Gear & Bar</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free 1st Trial Session For New Visitors</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-white">5</div>
            <div className="text-xs sm:text-sm font-medium text-emerald-400 mt-1">Championship Courts</div>
            <p className="text-xs text-slate-500 mt-1">Tennis, Turf Cricket & Padel</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-yellow-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-white">3</div>
            <div className="text-xs sm:text-sm font-medium text-amber-400 mt-1">Tailored Tiers</div>
            <p className="text-xs text-slate-500 mt-1">Gold, Silver & Junior Plans</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-teal-500 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-white">100%</div>
            <div className="text-xs sm:text-sm font-medium text-teal-400 mt-1">Real-Time Availability</div>
            <p className="text-xs text-slate-500 mt-1">Instant slot booking view</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-white">20%</div>
            <div className="text-xs sm:text-sm font-medium text-emerald-400 mt-1">Pro Shop & Bar Savings</div>
            <p className="text-xs text-slate-500 mt-1">Integrated member discounts</p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 text-center">
          <a
            href="#plans-section"
            className="inline-flex flex-col items-center gap-1 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <span>Explore Plans & Offerings</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-emerald-400" />
          </a>
        </div>
      </div>
    </section>
  );
}
