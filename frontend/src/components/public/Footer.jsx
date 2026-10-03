import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  ShoppingBag, 
  ExternalLink, 
  Heart,
  Crown
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-[#01100a] border-t border-[#dfc99a]/15 text-[#ede0c4]/70">
      {/* Upper Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] p-0.5 shadow-lg shadow-[#dfc99a]/10">
                <div className="w-full h-full rounded-[10px] bg-[#02140e] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#dfc99a] stroke-[2.2]" />
                </div>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                THE CHAMPIONS <span className="champagne-gradient-text">CLUB</span>
              </span>
            </div>
            <p className="text-sm text-[#ede0c4]/80 leading-relaxed max-w-sm">
              The premier athletic & country club engineered for competitive players and weekend enthusiasts.
              Enjoy championship tennis courts, European clay, floodlit box cricket arenas, panoramic padel,
              and a fully integrated pro shop and private social lounge.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/20">
                <Crown className="w-3 h-3 text-[#dfc99a]" />
                Official Champions Club Platform
              </span>
              <span className="text-xs text-[#ede0c4]/50">Est. 2024</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-xs tracking-widest uppercase font-mono">Explore Club</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  Club Overview
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-[#dfc99a]" />
                  Membership Tiers
                </Link>
              </li>
              <li>
                <Link to="/members" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  Member Directory & Portal
                </Link>
              </li>
              <li>
                <Link to="/members/register" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  New Member Enrollment
                </Link>
              </li>
              <li>
                <Link to="/courts" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Live Court Availability
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#dfc99a]" />
                  Pro Shop & Workshop
                </Link>
              </li>
              <li>
                <Link to="/enquiry" className="hover:text-[#dfc99a] transition-colors flex items-center gap-1.5">
                  Book Complimentary Pass
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-xs tracking-widest uppercase font-mono">Club Timings</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Championship Courts</div>
                  <div className="text-xs text-[#ede0c4]/70">06:00 AM – 11:00 PM Daily</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#dfc99a] shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Pro Shop & Restringing</div>
                  <div className="text-xs text-[#ede0c4]/70">08:00 AM – 09:30 PM</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Club Lounge & Bar</div>
                  <div className="text-xs text-[#ede0c4]/70">07:00 AM – 11:30 PM</div>
                </div>
              </li>
              <li className="pt-1 text-xs text-[#dfc99a] font-semibold">
                ★ Friday Night Social Mixer: 6 PM - 9 PM
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-xs tracking-widest uppercase font-mono">Club Concierge</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#dfc99a] shrink-0 mt-1" />
                <span>The Champions Club Arena, Sector 48, Sports Complex Road, Ahmedabad, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#dfc99a] shrink-0" />
                <a href="tel:+919876543210" className="hover:text-[#dfc99a] transition-colors">
                  +91 (0) 98765-43210
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#dfc99a] shrink-0" />
                <a href="mailto:concierge@championsclub.com" className="hover:text-[#dfc99a] transition-colors">
                  concierge@championsclub.com
                </a>
              </div>
              <div className="pt-2">
                <Link
                  to="/enquiry"
                  className="inline-flex items-center gap-1.5 text-xs text-[#dfc99a] hover:text-[#f7f1e3] font-bold underline underline-offset-4"
                >
                  Send Direct Inquiry <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#dfc99a]/10 bg-[#01100a]/90 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#ede0c4]/50">
          <div className="flex items-center gap-2">
            <span>© {CURRENT_YEAR} The Champions Club. All rights reserved.</span>
            <span>•</span>
            <span className="text-[#dfc99a]/90 font-medium">Bespoke Athletic Excellence</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#dfc99a] cursor-pointer">Bylaws & Etiquette</span>
            <span className="hover:text-[#dfc99a] cursor-pointer">Privacy Policy</span>
            <span className="text-[#ede0c4]/70 flex items-center gap-1">
              Crafted for Champions
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
