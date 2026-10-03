import React from 'react';
import EnquiryFormSection from '../../components/public/EnquiryFormSection.jsx';
import { 
  PhoneCall, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Sparkles,
  Trophy
} from 'lucide-react';

export default function EnquiryPage() {
  return (
    <div className="py-12 space-y-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Connect With Champions Club</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Start Your Journey With a Free Trial
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Whether you want to try our courts for the first time, request an institutional membership quote, 
          or hold a prime tournament slot, reach out directly to our team.
        </p>
      </div>

      {/* Quick Contact & Facility Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Direct Front Desk Phone</h3>
            <p className="text-xs text-slate-400">
              Speak to our duty manager for immediate slot confirmations or walk-in assistance.
            </p>
            <div className="pt-2 text-sm font-bold text-emerald-400">
              <a href="tel:+919876543210" className="hover:underline">
                +91 (0) 98765-43210
              </a>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">WhatsApp Member Concierge</h3>
            <p className="text-xs text-slate-400">
              Get rapid answers regarding stringing updates, social play groups, and rain checks.
            </p>
            <div className="pt-2 text-sm font-bold text-teal-400">
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Message +91 98765 43210
              </a>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Front Desk Timings</h3>
            <p className="text-xs text-slate-400">
              Operating 7 days a week including public holidays:
            </p>
            <div className="pt-2 text-xs font-semibold text-slate-200">
              06:00 AM – 11:00 PM Daily
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Enquiry Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EnquiryFormSection embedded={true} />
      </div>

      {/* Location Map & Visit Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Location & Parking</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Visiting The Champions Club Arena
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Located on Sports Complex Road, Sector 48 with direct highway access. 
              Ample valet and self-parking available on premises with EV charging stations.
            </p>
            <div className="pt-2 text-xs text-slate-300">
              <strong>Landmark:</strong> Opposite Green Valley Sports Park, 5 minutes from Central Metro Station.
            </div>
          </div>

          <div className="w-full md:w-80 h-44 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-4 space-y-2">
            <Trophy className="w-8 h-8 text-emerald-400" />
            <div className="text-sm font-bold text-white">The Champions Club Ground</div>
            <span className="text-[11px] text-slate-400">Ahmedabad / Gujarat, India</span>
            <span className="text-[10px] text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Open Daily from 6 AM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
