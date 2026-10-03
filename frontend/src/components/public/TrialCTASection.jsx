import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Trophy, PhoneCall, Crown } from 'lucide-react';

export default function TrialCTASection() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-[#dfc99a]/35 bg-gradient-to-br from-[#06261b] via-[#041c14] to-[#02140e] shadow-2xl">
          {/* Subtle Glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#dfc99a]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#dfc99a]/15 border border-[#dfc99a]/30 text-[#dfc99a] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>Complimentary Visitor Invitation</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Step Onto the Court? <br />
              <span className="champagne-gradient-text font-black">
                Your First Trial Session is on Us.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#ede0c4]/85 leading-relaxed max-w-2xl">
              No subscription obligation. Reserve a 60-minute trial session on our championship tennis courts, 
              European clay, box cricket turf, or padel arena. Rackets and trial balls provided at the counter.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/enquiry?intent=free_trial"
                className="btn-champagne inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm sm:text-base shadow-xl"
              >
                <span>Claim Complimentary Trial Pass</span>
                <ArrowRight className="w-4 h-4 text-[#02140e]" />
              </Link>
              <a
                href="tel:+919876543210"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#02140e]/90 hover:bg-[#041c14] text-[#f4efe4] border border-[#dfc99a]/25 text-sm font-semibold transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-[#dfc99a]" />
                <span>Concierge Desk: +91 98765 43210</span>
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#ede0c4]/70 border-t border-[#dfc99a]/15">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Upfront Commitment</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#dfc99a]" />
                <span>Full Locker Room & Shower Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
