import React from 'react';
import { 
  CalendarCheck, 
  ShieldCheck, 
  ShoppingBag, 
  Coffee, 
  CheckCircle, 
  Zap 
} from 'lucide-react';

export default function ClubHighlightsSection() {
  const highlights = [
    {
      icon: CalendarCheck,
      badge: 'Zero Double-Booking',
      title: 'Real-Time Court Engine',
      description: 'Never worry about arriving to a taken court. 60-minute sessions with rolling 30-minute intervals and ironclad digital slot locking.',
      color: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30'
    },
    {
      icon: ShieldCheck,
      badge: 'Gold • Silver • Junior',
      title: 'Automated Tier Entitlements',
      description: 'Your plan benefits follow you everywhere. Front desk staff recognise your status instantly with automated court, shop, and bar discounts.',
      color: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30'
    },
    {
      icon: ShoppingBag,
      badge: 'Counter & Delivery',
      title: 'Integrated Pro Shop',
      description: 'Snapped a racket string 10 mins before play? Our express restringing workshop and synchronized shelf inventory keep you in the game.',
      color: 'from-teal-500/20 to-cyan-500/5 text-teal-400 border-teal-500/30'
    },
    {
      icon: Coffee,
      badge: 'Tabs & Member Rates',
      title: 'Post-Match Lounge & Cafe',
      description: 'Ditch the paper receipts. Members run seamless tabs, settle up by UPI or card, and automatically enjoy exclusive food & beverage privileges.',
      color: 'from-purple-500/20 to-indigo-500/5 text-purple-400 border-purple-500/30'
    }
  ];

  return (
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>The Modern Club Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Built to Eliminate Club Headaches
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From the first-time visitor finding us online to the regular member hitting the courts, 
            every detail is engineered for effortless play.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} border flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                      {item.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Standard at Champions Club</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
