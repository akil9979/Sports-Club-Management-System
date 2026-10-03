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
  Heart 
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400">
      {/* Upper Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                THE CHAMPIONS <span className="text-emerald-400">CLUB</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The premier athletic club engineered for competitive players and weekend enthusiasts.
              Enjoy championship tennis courts, floodlit box cricket arenas, panoramic padel,
              and a fully integrated pro shop and social lounge.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Official Champions Club Platform
              </span>
              <span className="text-xs text-slate-500">100% Digital Bookings</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase">Explore Club</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  Club Overview
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <Link to="/members" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  Member Directory & Portal
                </Link>
              </li>
              <li>
                <Link to="/members/register" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  New Member Registration
                </Link>
              </li>
              <li>
                <Link to="/courts" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Live Court Availability
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  Pro Shop Gear
                </Link>
              </li>
              <li>
                <Link to="/enquiry" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  Book Free Trial Pass
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase">Club Timings</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-200 font-medium">Court Sessions</div>
                  <div className="text-xs text-slate-400">06:00 AM – 11:00 PM Daily</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-200 font-medium">Pro Shop & Restringing</div>
                  <div className="text-xs text-slate-400">08:00 AM – 09:30 PM</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-200 font-medium">Lounge & Sports Bar</div>
                  <div className="text-xs text-slate-400">07:00 AM – 11:30 PM</div>
                </div>
              </li>
              <li className="pt-1 text-xs text-emerald-400 font-medium">
                ★ Friday Night Social Mixer: 6 PM - 9 PM
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase">Find Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <span>The Champions Club, Sector 48, Sports Complex Road, Ahmedabad / Gujarat</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-emerald-400 transition-colors">
                  +91 (0) 98765-43210
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:frontdesk@championsclub.com" className="hover:text-emerald-400 transition-colors">
                  frontdesk@championsclub.com
                </a>
              </div>
              <div className="pt-2">
                <Link
                  to="/enquiry"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                >
                  Send Direct Enquiry <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 bg-slate-950/80 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {CURRENT_YEAR} The Champions Club. All rights reserved.</span>
            <span>•</span>
            <span className="text-emerald-500/80">Digital Sports Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Terms of Play</span>
            <span>Court Etiquette</span>
            <span>Privacy Policy</span>
            <span className="text-slate-400 flex items-center gap-1">
              Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for Champions
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
