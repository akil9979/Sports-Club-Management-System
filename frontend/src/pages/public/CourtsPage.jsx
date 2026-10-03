import React from 'react';
import CourtAvailabilitySection from '../../components/public/CourtAvailabilitySection.jsx';
import TrialCTASection from '../../components/public/TrialCTASection.jsx';
import { 
  Calendar, 
  Activity, 
  Layers, 
  Sun 
} from 'lucide-react';

export default function CourtsPage() {
  const courtSpecs = [
    {
      name: 'Centre Court (Tennis)',
      surface: 'Championship Plexipave Hard Court',
      lighting: '1,000 Lux LED Broadcast Floodlights',
      capacity: '4 Players (Singles / Doubles)',
      features: ['Tournament acrylic surface', 'Official ball boy stations', 'Spectator bleachers', 'Digital game clock']
    },
    {
      name: 'Court 2 (European Clay)',
      surface: 'Natural French Red Clay',
      lighting: '800 Lux Anti-Glare Floodlights',
      capacity: '4 Players',
      features: ['Joint-cushioning slide', 'Controlled slower tempo', 'Daily clay rolling & line maintenance', 'Courtside hydration']
    },
    {
      name: 'Box Cricket Arena 1',
      surface: 'Heavy-Duty AstroTurf Pro',
      lighting: 'Shadowless High-Bay LED Lights',
      capacity: 'Up to 16 Players (8v8 matches)',
      features: ['Automated bowling machine ready', 'Ceiling and side safety netting', 'Boundary rebound walls', 'Match ball supplied']
    },
    {
      name: 'Box Cricket Arena 2',
      surface: 'Shock-Absorbing Turf Wicket',
      lighting: 'Shadowless High-Bay LED Lights',
      capacity: 'Up to 16 Players',
      features: ['Digital scoreboard display', 'Spectator gallery seating', 'High-rebound perimeter padding', 'Dugout player benches']
    },
    {
      name: 'Padel Court Alpha',
      surface: 'Panoramic 12mm Glass + Synthetic Turf',
      lighting: 'Anti-Glare Column LED',
      capacity: '4 Players (Doubles Play)',
      features: ['Seamless panoramic glass walls', 'Textured synthetic turf', 'Pro padel rackets for rent', 'WPT regulation specifications']
    }
  ];

  return (
    <div className="py-12 space-y-16">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Court Facilities & Live Booking Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Championship Surfaces for Every Game
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          From fast-paced hard courts and forgiving European clay to high-octane box cricket turfs and panoramic padel, 
          every playing surface is maintained to tournament standards daily.
        </p>
      </div>

      {/* Live Availability Section Embed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CourtAvailabilitySection embedded={true} />
      </div>

      {/* Court Specifications Detailed Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Court Specifications & Amenities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Professional specs designed to maximize player safety, consistent bounce, and night visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courtSpecs.map((spec, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white tracking-tight">{spec.name}</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Surface: <strong className="text-slate-200">{spec.surface}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Lighting: <strong className="text-slate-200">{spec.lighting}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Capacity: <strong className="text-slate-200">{spec.capacity}</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Amenities</span>
                  {spec.features.map((feat, fIdx) => (
                    <div key={fIdx} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60">
                <a
                  href="#courts-section"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Check Open Slots Above</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trial CTA */}
      <TrialCTASection />
    </div>
  );
}
