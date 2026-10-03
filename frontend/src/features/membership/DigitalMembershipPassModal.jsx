import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  Award, 
  Download, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  User, 
  QrCode, 
  Sparkles, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { 
  generateMemberQrPayload, 
  renderMemberQrDataUrl, 
  TIER_CONFIG 
} from './qrVerificationService.js';
import { useNavigate } from 'react-router-dom';

export default function DigitalMembershipPassModal({ 
  isOpen, 
  onClose, 
  member, 
  membership = null 
}) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeView, setActiveView] = useState('card'); // 'card' or 'details'

  const ms = membership || member?.activeMembership || member?.membership;
  const tier = ms?.tier || 'Walk-In';
  const tierStyle = TIER_CONFIG[tier] || TIER_CONFIG.Standard;

  const payload = React.useMemo(() => {
    if (!member) return null;
    return generateMemberQrPayload(member, ms);
  }, [member, ms]);

  // Generate high-res QR code on load
  useEffect(() => {
    if (!payload) return;
    let isMounted = true;
    renderMemberQrDataUrl(payload, { width: 340 })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('Failed to generate QR DataURL:', err));

    return () => {
      isMounted = false;
    };
  }, [payload]);

  if (!isOpen || !member) return null;

  const isExpired = payload?.membership?.status === 'expired';
  const isExpiringSoon = payload?.membership?.status === 'expiring_soon';
  const daysRemaining = payload?.membership?.daysRemaining ?? 0;

  const handleCopyPayload = () => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `ChampionsClub-Pass-${member.memberNumber || member.id}.png`;
      link.href = qrDataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSimulateFrontdesk = () => {
    onClose();
    navigate('/staff/operations?tab=frontdesk&scan=' + encodeURIComponent(member.id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-[#041c14] border border-emerald-900/60 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/40 bg-[#02140e]/90">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tierStyle.iconBg} shadow-sm`}>
              {tier === 'Gold' ? (
                <Crown className="w-4 h-4 text-[#dfc99a]" />
              ) : tier === 'Silver' ? (
                <ShieldCheck className="w-4 h-4 text-slate-300" />
              ) : tier === 'Junior' ? (
                <Award className="w-4 h-4 text-emerald-400" />
              ) : (
                <QrCode className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-[#fcfaf5] tracking-wide flex items-center gap-2">
                Official Digital Membership Pass
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${tierStyle.iconBg}`}>
                  {tier}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-400/70">
                Authorized credentials for Frontdesk verification & club check-in
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-[#07261c] transition"
            title="Close Pass"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Status Alert Banner */}
          {isExpired ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/70 text-xs text-rose-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  <strong>Membership Expired: </strong>
                  Expired on {payload.membership.endDate} ({Math.abs(daysRemaining)} days ago).
                </span>
              </div>
            </div>
          ) : isExpiringSoon ? (
            <div className="p-3.5 rounded-2xl bg-[#dfc99a]/15 border border-[#dfc99a]/60 text-xs text-[#dfc99a] flex items-center gap-2.5 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                <strong>Expiring Soon: </strong>
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining until renewal.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Active Member in Good Standing ({daysRemaining} days remaining)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400/80 bg-[#02140e] px-2 py-0.5 rounded-lg border border-emerald-900/60">
                Tamper-Verified
              </span>
            </div>
          )}

          {/* Premium Digital Wallet Card (Apple / VIP Pass Style) */}
          <div 
            ref={cardRef}
            className={`rounded-3xl p-6 sm:p-7 border relative overflow-hidden shadow-2xl transition-all ${
              tier === 'Gold'
                ? 'bg-gradient-to-br from-[#120e06] via-[#041c14] to-[#02140e] border-[#dfc99a]/50 shadow-[#dfc99a]/10'
                : tier === 'Silver'
                ? 'bg-gradient-to-br from-[#0f172a] via-[#041c14] to-[#02140e] border-slate-600/50 shadow-slate-900/30'
                : tier === 'Junior'
                ? 'bg-gradient-to-br from-[#022c22] via-[#041c14] to-[#02140e] border-emerald-500/50 shadow-emerald-500/10'
                : 'bg-gradient-to-br from-[#07261c] to-[#02140e] border-emerald-800/40'
            }`}
          >
            {/* Background Holographic Watermark Embellishment */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 bg-gradient-to-br from-white to-transparent pointer-events-none blur-xl" />
            <div className="absolute bottom-2 right-4 text-[70px] font-black font-serif opacity-5 select-none pointer-events-none text-white">
              CC
            </div>

            {/* Top Pass Brand & Tier Identity */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] font-serif font-black text-base flex items-center justify-center shadow-md">
                  CC
                </div>
                <div>
                  <h3 className="text-base font-serif font-black tracking-wide text-white">
                    CHAMPIONS CLUB
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfc99a] font-bold">
                      {payload.membership.planName}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-[10px] text-emerald-300/70 uppercase">
                      Frontdesk Credential
                    </span>
                  </div>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-inner ${
                tier === 'Gold'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/40'
                  : tier === 'Silver'
                  ? 'bg-slate-700/60 text-slate-200 border-slate-500/50'
                  : tier === 'Junior'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                {tier === 'Gold' && <Crown className="w-3.5 h-3.5" />}
                {tier === 'Silver' && <ShieldCheck className="w-3.5 h-3.5" />}
                {tier === 'Junior' && <Award className="w-3.5 h-3.5" />}
                <span>{tier} Pass</span>
              </div>
            </div>

            {/* Middle Section: Member Photo/Avatar + Centered High-Res QR Code */}
            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 relative z-10">
              {/* Member Summary */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold block">
                    Club Member Owner
                  </span>
                  <h4 className="text-xl sm:text-2xl font-serif font-black text-white mt-0.5 tracking-tight">
                    {payload.member.name}
                  </h4>
                  <div className="inline-block mt-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#02140e]/90 text-[#dfc99a] border border-[#dfc99a]/30">
                    ID: {payload.member.memberNumber || payload.member.id}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-emerald-200/80">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{payload.member.phone}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[200px]">{payload.member.email}</span>
                  </div>
                  {payload.member.age !== null && (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-emerald-300">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Age: {payload.member.age} yrs {tier === 'Junior' && '(Junior Eligibility Verified)'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* High-Resolution QR Code Block */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl shadow-2xl border-2 border-emerald-900/40 relative group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt={`QR Code Pass for ${payload.member.name}`}
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-slate-800">
                      <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 mt-2 font-semibold">
                  SCAN AT FRONTDESK
                </span>
              </div>
            </div>

            {/* Bottom Strip: Dates & Key Privileges */}
            <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left relative z-10">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400/60 font-semibold block">
                  Valid From
                </span>
                <span className="text-xs font-bold text-white font-mono mt-0.5 block">
                  {payload.membership.startDate}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400/60 font-semibold block">
                  Valid Till (Expiry)
                </span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${
                  isExpired ? 'text-rose-400' : 'text-[#dfc99a]'
                }`}>
                  {payload.membership.endDate}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400/60 font-semibold block">
                  Court Access
                </span>
                <span className="text-xs font-semibold text-emerald-200 mt-0.5 block truncate" title={payload.membership.courtPrivileges}>
                  {tier === 'Gold' ? 'Complimentary' : tier === 'Silver' ? '50% Discount' : 'Off-Peak Access'}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400/60 font-semibold block">
                  Discounts
                </span>
                <span className="text-xs font-semibold text-emerald-200 mt-0.5 block">
                  {payload.membership.shopDiscount.replace('Pro Shop discount', 'Shop')} / {payload.membership.barDiscount.replace('Lounge & Bar discount', 'Bar')}
                </span>
              </div>
            </div>

            {/* Security Badge Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-emerald-400/50 font-mono">
              <span>SIG: {payload.security.signature}</span>
              <span>EMERGENCY: {payload.member.emergencyContact || 'Club Reception'}</span>
            </div>
          </div>

          {/* Quick Entitlement Chips */}
          <div className="p-4 rounded-2xl bg-[#02140e]/90 border border-emerald-900/50 space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-400/70 tracking-wider block">
              Verified Club Privileges Included in this QR Code
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-200/90">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Court Privilege:</strong> {payload.membership.courtPrivileges}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dfc99a]"></span>
                <span><strong>Advance Booking:</strong> {payload.membership.advanceBookingDays} Days Window</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span><strong>Pro Shop Discount:</strong> {payload.membership.shopDiscount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span><strong>Sports Bar Discount:</strong> {payload.membership.barDiscount}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading || !qrDataUrl}
              className="py-3 px-4 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download QR Pass</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPayload}
              className="py-3 px-4 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Payload Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>Copy QR Data</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulateFrontdesk}
              className="py-3 px-4 rounded-xl btn-champagne font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-[#dfc99a]/15"
            >
              <span>Test at Frontdesk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
