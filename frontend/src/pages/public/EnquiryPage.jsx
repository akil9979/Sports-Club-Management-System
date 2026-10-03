import React from 'react';
import EnquiryFormSection from '../../components/public/EnquiryFormSection.jsx';
import { 
  PhoneCall, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Sparkles,
  Trophy,
  Crown
} from 'lucide-react';

export default function EnquiryPage() {
  return (
    <div className="py-12 space-y-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
          <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />
          <span>Connect With Club Concierge</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Begin Your Journey With a Complimentary Pass
        </h1>
        <p className="text-[#ede0c4]/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Whether you wish to experience our courts for the first time, request an institutional membership consultation, 
          or reserve a prime tournament slot, our concierge team is at your service.
        </p>
      </div>

      {/* Quick Contact & Facility Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Direct Concierge Line</h3>
            <p className="text-xs text-[#ede0c4]/75">
              Speak directly to our duty manager for immediate slot confirmations or visitor guidance.
            </p>
            <div className="pt-2 text-sm font-bold text-[#dfc99a]">
              <a href="tel:+919876543210" className="hover:underline">
                +91 (0) 98765-43210
              </a>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] flex items-center justify-center border border-[#dfc99a]/30">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Instant Messaging Desk</h3>
            <p className="text-xs text-[#ede0c4]/75">
              Rapid responses regarding restringing status, tournament fixtures, and court updates.
            </p>
            <div className="pt-2 text-sm font-bold text-emerald-400">
              <a href="tel:+919876543210" className="hover:underline">
                Direct Line: +91 98765 43210
              </a>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Front Desk Timings</h3>
            <p className="text-xs text-[#ede0c4]/75">
              Operating 7 days a week, including weekends and public holidays:
            </p>
            <div className="pt-2 text-xs font-bold text-[#dfc99a]">
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
        <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-[#dfc99a] uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#dfc99a]" />
              <span>Arena Location & Parking</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Visiting The Champions Club Arena
            </h3>
            <p className="text-xs sm:text-sm text-[#ede0c4]/80 leading-relaxed">
              Located on Sports Complex Road, Sector 48 with direct highway access. 
              Ample valet and secure parking available on premises with high-speed EV charging stations.
            </p>
            <div className="pt-2 text-xs text-[#ede0c4]/90">
              <strong>Landmark:</strong> Opposite Green Valley Sports Park, 5 minutes from Central Metro Station.
            </div>
          </div>

          <div className="w-full md:w-80 h-44 rounded-2xl bg-[#02140e] border border-[#dfc99a]/25 flex flex-col items-center justify-center text-center p-4 space-y-2 shadow-xl">
            <Trophy className="w-8 h-8 text-[#dfc99a]" />
            <div className="text-sm font-bold text-white">The Champions Club Ground</div>
            <span className="text-[11px] text-[#ede0c4]/70">Ahmedabad, Gujarat, India</span>
            <span className="text-[10px] text-[#dfc99a] font-bold px-3 py-1 rounded-full bg-[#dfc99a]/10 border border-[#dfc99a]/25">
              Open Daily from 6:00 AM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
