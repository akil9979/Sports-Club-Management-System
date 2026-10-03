import React from 'react';
import ShopCatalogueSection from '../../components/public/ShopCatalogueSection.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { 
  ShoppingBag, 
  Sparkles, 
  Percent, 
  ShieldCheck, 
  Clock, 
  Truck, 
  UserCheck, 
  Tag 
} from 'lucide-react';

export default function MemberShopPage() {
  const { user } = useAuth();
  const isGold = user?.role === 'member' || user?.tier === 'Gold';

  return (
    <div className="py-10 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Member Header Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#dfc99a]/30 bg-gradient-to-r from-[#06261b] via-[#041c14] to-[#02140e] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#dfc99a]" />
              <span>Member Pro Equipment Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-white tracking-tight">
              Exclusive Member Pro Shop & Gear Desk
            </h1>
            <p className="text-xs sm:text-sm text-[#ede0c4]/80 max-w-xl leading-relaxed">
              Welcome {user?.firstName ? `${user.firstName}` : 'Member'}. Your tier privileges give you up to 20% savings on match gear, racket restringing, and club locker drop-off.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center md:items-end gap-2 bg-[#02140e]/90 p-4 rounded-2xl border border-[#dfc99a]/20">
            <div className="flex items-center gap-2 text-[#dfc99a] text-xs font-bold uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-[#dfc99a]" />
              <span>{user?.memberNumber ? `Account: ${user.memberNumber}` : 'Active Member Account'}</span>
            </div>
            <div className="text-sm font-bold text-white">
              Privilege Tier: <span className="text-[#dfc99a]">{user?.tier || (isGold ? 'Gold Tier (20% Off)' : 'Silver Tier (10% Off)')}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">
              ✓ Automated discounts applied at invoice generation
            </span>
          </div>
        </div>

        {/* Embedded Shop Catalogue */}
        <ShopCatalogueSection embedded={true} />
      </div>
  );
}
