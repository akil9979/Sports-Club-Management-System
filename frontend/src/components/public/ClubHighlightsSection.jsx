import React from 'react';
import { 
  CalendarCheck, 
  ShieldCheck, 
  ShoppingBag, 
  Coffee, 
  CheckCircle, 
  Crown,
  Trophy,
  Sparkles
} from 'lucide-react';

export default function ClubHighlightsSection() {
  const highlights = [
    {
      icon: CalendarCheck,
      badge: 'Championship Facilities',
      title: 'Precision Court Engine',
      description: 'Never arrive to an occupied court. 60-minute sessions with rolling 30-minute intervals and real-time live availability verification.',
      color: 'from-emerald-500/20 to-[#041c14] text-emerald-400 border-emerald-500/30'
    },
    {
      icon: Crown,
      badge: 'Gold • Silver • Junior',
      title: 'Automated Tier Privileges',
      description: 'Your plan benefits follow you everywhere. Front desk and lounge staff recognize your tier instantly with automated court, gear, and dining savings.',
      color: 'from-[#dfc99a]/20 to-[#041c14] text-[#dfc99a] border-[#dfc99a]/30'
    },
    {
      icon: ShoppingBag,
      badge: 'Express 10-Min Service',
      title: 'Pro Workshop & Gear',
      description: 'Snapped a string before your match? Our calibrated electronic restringing workshop and synchronized shelf inventory keep you in top form.',
      color: 'from-emerald-500/20 to-[#041c14] text-emerald-400 border-emerald-500/30'
    },
    {
      icon: Coffee,
      badge: 'Member Tabs & Lounge',
      title: 'The Champions Lounge & Bar',
      description: 'Ditch paper receipts. Members run seamless tabs, settle up via card or UPI, and enjoy exclusive food, smoothie, and beverage privileges.',
      color: 'from-[#dfc99a]/20 to-[#041c14] text-[#dfc99a] border-[#dfc99a]/30'
    }
  ];

  return (
    <section className="py-20 bg-[#02140e] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-[#dfc99a]" />
            <span>The Premier Club Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Championship Excellence
          </h2>
          <p className="text-[#ede0c4]/80 text-sm sm:text-base leading-relaxed">
            From seamless digital court scheduling to post-match relaxation in our private lounge, 
            every detail is crafted for players who demand the best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 rounded-2xl glass-panel-hover flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} border flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#dfc99a]/80 block mb-1">
                      {item.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#ede0c4]/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#dfc99a]/10 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>The Champions Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
