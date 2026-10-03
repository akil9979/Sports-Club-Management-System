import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Crown,
  ChevronDown,
  Trophy,
  ShieldCheck,
  Star
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background Glows & Accent Gradients in Emerald Ink & Champagne */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-emerald-600/15 via-[#dfc99a]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#dfc99a]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-emerald-700/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Prestige Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#041c14]/90 border border-[#dfc99a]/30 text-[#dfc99a] text-xs sm:text-sm font-semibold shadow-lg shadow-[#dfc99a]/5 backdrop-blur-md">
            <Crown className="w-4 h-4 text-[#dfc99a]" />
            <span className="tracking-wider uppercase font-bold text-[11px] sm:text-xs">
              EST. 2024 • Championship Athletic & Country Club
            </span>
            <span className="text-[#dfc99a]/40">•</span>
            <span className="text-[#f4efe4]/90 text-[11px] sm:text-xs">PGA & ATP Regulation Standards</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Elevate Your Game at <br />
            <span className="champagne-gradient-text font-black">
              The Champions Club
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-[#ede0c4]/90 leading-relaxed font-normal max-w-2xl mx-auto">
            Experience tournament-grade Plexipave tennis, natural European clay, floodlit box cricket arenas, 
            panoramic padel, and an in-house pro gear workshop. Transparent membership tiers, 
            instant court booking, and curated clubhouse privileges.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/enquiry"
              className="btn-champagne w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base"
            >
              <Sparkles className="w-5 h-5 text-[#87632b]" />
              <span>Claim Complimentary Pass</span>
              <ArrowRight className="w-4 h-4 text-[#02140e]" />
            </Link>

            <Link
              to="/courts"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#041c14]/90 hover:bg-[#07261c] text-[#f4efe4] border border-[#dfc99a]/25 text-base font-semibold transition-all hover:border-[#dfc99a]/60 shadow-lg"
            >
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Check Live Court Slots</span>
            </Link>
          </div>

          {/* Feature Highlights Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-[#ede0c4]/80">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#041c14]/80 border border-[#dfc99a]/15 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Guaranteed Slot Reservations</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#041c14]/80 border border-[#dfc99a]/15 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-[#dfc99a]" />
              <span>Member Privileges on Pro Gear & Lounge</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#041c14]/80 border border-[#dfc99a]/15 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>10-Minute Express Restringing Workshop</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-white">5</div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">Championship Courts</div>
            <p className="text-xs text-[#ede0c4]/60 mt-1">Tennis, Clay, Cricket & Padel</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#f7f1e3] to-[#c59e4b] opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-[#dfc99a]">3</div>
            <div className="text-xs sm:text-sm font-semibold text-[#dfc99a] mt-1">Curated Tiers</div>
            <p className="text-xs text-[#ede0c4]/60 mt-1">Gold, Silver & Junior Plans</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-[#dfc99a] opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-white">100%</div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">Live Availability</div>
            <p className="text-xs text-[#ede0c4]/60 mt-1">Instant court schedule view</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#dfc99a] to-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="text-3xl sm:text-4xl font-extrabold text-[#dfc99a]">20%</div>
            <div className="text-xs sm:text-sm font-semibold text-[#dfc99a] mt-1">Pro Shop & Lounge Privileges</div>
            <p className="text-xs text-[#ede0c4]/60 mt-1">Tier-linked automated savings</p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 text-center">
          <a
            href="#plans-section"
            className="inline-flex flex-col items-center gap-1 text-xs text-[#ede0c4]/60 hover:text-[#dfc99a] transition-colors"
          >
            <span>Explore Membership Offerings</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#dfc99a]" />
          </a>
        </div>
      </div>
    </section>
  );
}
