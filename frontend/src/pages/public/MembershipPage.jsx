import React from 'react';
import MembershipPlansSection from '../../components/public/MembershipPlansSection.jsx';
import TrialCTASection from '../../components/public/TrialCTASection.jsx';
import { 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';

export default function MembershipPage() {
  const comparisonMatrix = [
    {
      feature: 'Court Booking Window',
      gold: '14 Days in Advance',
      silver: '7 Days in Advance',
      junior: '3 Days in Advance'
    },
    {
      feature: 'Peak Court Hour Discount',
      gold: '100% Free (All slots)',
      silver: '50% Off Standard Rates',
      junior: 'Off-Peak Free (3-6 PM)'
    },
    {
      feature: 'Pro Shop & Restringing Discount',
      gold: '20% Off Everything',
      silver: '10% Off Gear',
      junior: '10% Off Junior Gear'
    },
    {
      feature: 'Sports Lounge & Bar Discount',
      gold: '15% Off Total Bill',
      silver: '10% Off Total Bill',
      junior: '10% Off Healthy Snacks'
    },
    {
      feature: 'Guest Passes Included',
      gold: '2 Passes Every Month',
      silver: 'Guest Member Rates',
      junior: 'Parent Spectator Access'
    },
    {
      feature: 'Personal Locker & Towel Service',
      gold: 'Included Free',
      silver: '₹500 / month add-on',
      junior: 'Day use only'
    },
    {
      feature: 'Tournaments & Social Mixers',
      gold: 'VIP Priority Seed',
      silver: 'Standard Entry',
      junior: 'Junior League Entry'
    }
  ];

  const faqs = [
    {
      q: 'How does court booking work for Gold vs Silver members?',
      a: 'Gold members enjoy unlimited complimentary court bookings on Tennis, Cricket, and Padel with a 14-day advance booking window. Silver members pay half-price standard court rates with a 7-day advance booking window.'
    },
    {
      q: 'Can non-members and walk-ins play at the club?',
      a: 'Yes! Walk-in guests can book any available slot at standard hourly rates (₹700 – ₹1,200/hr) subject to availability. However, prime evening slots fill quickly, so joining a tier is recommended.'
    },
    {
      q: 'What is the Junior tier eligibility?',
      a: 'The Junior tier is open to athletes under 18 years of age. It includes structured weekend coaching clinics, weekday afternoon court access, and discounted youth gear.'
    },
    {
      q: 'How do shop and bar discounts work?',
      a: 'Your tier is linked to your member profile. Whenever you order at the pro shop, restringing desk, or cafeteria, the discount is automatically applied to your bill or tab.'
    }
  ];

  return (
    <div className="py-12 space-y-16">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Membership Tiers & Privileges</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Invest in Your Passion
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Select the tier that fits your rhythm. Enjoy priority court reservations, 
          exclusive member shop pricing, and seamless lounge tabs.
        </p>
      </div>

      {/* Plans Section Embed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MembershipPlansSection embedded={true} />
      </div>

      {/* Feature Comparison Matrix */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Tier-by-Tier Comparison
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear breakdown of privileges and benefits across all three club membership levels.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-4 px-4 font-semibold">Club Benefit</th>
                  <th className="py-4 px-4 font-bold text-amber-400">Gold Championship</th>
                  <th className="py-4 px-4 font-bold text-slate-300">Silver Standard</th>
                  <th className="py-4 px-4 font-bold text-emerald-400">Junior (U18)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-4 font-medium text-slate-200">{row.feature}</td>
                    <td className="py-4 px-4 text-amber-300 font-semibold">{row.gold}</td>
                    <td className="py-4 px-4 text-slate-300">{row.silver}</td>
                    <td className="py-4 px-4 text-emerald-300">{row.junior}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Got questions about joining The Champions Club? Here is what players ask most.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trial CTA */}
      <TrialCTASection />
    </div>
  );
}
