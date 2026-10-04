import React, { useState } from 'react';
import ShopCatalogueSection from '../../components/public/ShopCatalogueSection.jsx';
import TrialCTASection from '../../components/public/TrialCTASection.jsx';
import { 
  ShoppingBag, 
  Percent, 
  Truck, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Wrench, 
  Trophy 
} from 'lucide-react';

export default function ShopPage() {
  const [calcAmount, setCalcAmount] = useState(10000);

  const goldSavings = Math.round(calcAmount * 0.20);
  const silverSavings = Math.round(calcAmount * 0.10);

  return (
    <div className="py-12 space-y-16">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/10 text-[#dfc99a] border border-[#dfc99a]/25 backdrop-blur-md">
            <ShoppingBag className="w-3.5 h-3.5 text-[#dfc99a]" />
            <span>The Pro Gear Shop & Workshop Desk</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            Pro Equipment & Workshop Desk
          </h1>
          <p className="text-[#ede0c4]/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Top-tier rackets, match balls, certified shoes, and tournament apparel. 
            Everything in stock is synchronized with the front desk for instant collection or locker delivery.
          </p>
        </div>

        {/* Member Discount Savings Calculator */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dfc99a]/30 bg-gradient-to-br from-[#06261b] via-[#041c14] to-[#02140e] shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#dfc99a] text-xs font-black uppercase tracking-wider">
                  <Percent className="w-4 h-4 text-[#dfc99a]" />
                  <span>Instant Member Discount Calculator</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  See How Much You Save on Gear
                </h3>
              </div>
              <div className="flex items-center gap-2 bg-[#02140e] p-2 rounded-xl border border-[#dfc99a]/20">
                <span className="text-xs text-[#ede0c4]/70 font-medium pl-2">Gear Value (₹):</span>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-3 py-1.5 rounded-lg bg-[#041c14] text-white font-bold text-sm border border-[#dfc99a]/30 text-right focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#dfc99a]/10 border border-[#dfc99a]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[#dfc99a] uppercase tracking-wider block">Gold Members (20% Off)</span>
                  <span className="text-xs text-[#ede0c4]/70">You pay ₹{(calcAmount - goldSavings).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-[#dfc99a]">
                    Save ₹{goldSavings.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/15 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Silver Members (10% Off)</span>
                  <span className="text-xs text-[#ede0c4]/70">You pay ₹{(calcAmount - silverSavings).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-[#ede0c4]">
                    Save ₹{silverSavings.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Catalogue Section with Provider Context */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ShopCatalogueSection embedded={true} />
        </div>

        {/* Pro Services Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Club Workshop & Player Services
            </h2>
            <p className="text-xs sm:text-sm text-[#ede0c4]/70">
              Professional sports maintenance directly behind the front counter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">10-Minute Express Restringing</h3>
              <p className="text-xs text-[#ede0c4]/75 leading-relaxed">
                Equipped with calibrated electronic stringing machines. Hand your racket in before warmup and pick it up ready for action.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] flex items-center justify-center border border-[#dfc99a]/30">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Locker Drop & Home Delivery</h3>
              <p className="text-xs text-[#ede0c4]/75 leading-relaxed">
                Order new balls, shoes, or grips online and have them waiting in your assigned club locker or delivered to your doorstep.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Authorized Brand Guarantee</h3>
              <p className="text-xs text-[#ede0c4]/75 leading-relaxed">
                Official partnerships with Head, Wilson, Babolat, Asics, SS Ton, and Bullpadel. Full manufacturer warranties on all equipment.
              </p>
            </div>
          </div>
        </div>

        <TrialCTASection />
      </div>
  );
}
