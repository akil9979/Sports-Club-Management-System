import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Sparkles, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { createLeadQuotation } from '../../features/crm/crmApi.js';

const PLAN_PRESETS = [
  { id: 'gold', name: 'Gold Championship', tier: 'Gold', baseAnnual: 47990, baseMonthly: 4999 },
  { id: 'silver', name: 'Silver Standard', tier: 'Silver', baseAnnual: 26870, baseMonthly: 2799 },
  { id: 'junior', name: 'Junior Rising Star', tier: 'Junior', baseAnnual: 14390, baseMonthly: 1499 }
];

export default function CreateQuotationModal({ isOpen, onClose, lead, onQuotationCreated }) {
  const [title, setTitle] = useState('');
  const [planId, setPlanId] = useState('gold');
  const [billingCycle, setBillingCycle] = useState('annual');
  const [amount, setAmount] = useState(47990);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [terms, setTerms] = useState(
    'Includes unlimited court bookings, 2 free guest passes monthly, 20% pro shop discount, and 15% lounge discount.'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initialize title and plan from lead preferences
  useEffect(() => {
    if (lead) {
      const preferredTier = (lead.interestTier || lead.interest_tier || 'Gold').toLowerCase();
      const matched = PLAN_PRESETS.find(p => p.tier.toLowerCase() === preferredTier) || PLAN_PRESETS[0];
      setPlanId(matched.id);
      setAmount(matched.baseAnnual);
      setTitle(`${matched.name} Annual Membership Quote for ${lead.name}`);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handlePlanChange = (selectedId) => {
    setPlanId(selectedId);
    const plan = PLAN_PRESETS.find(p => p.id === selectedId);
    if (plan) {
      const base = billingCycle === 'annual' ? plan.baseAnnual : plan.baseMonthly;
      setAmount(base);
      setTitle(`${plan.name} ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Membership Proposal for ${lead.name}`);
    }
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    const plan = PLAN_PRESETS.find(p => p.id === planId);
    if (plan) {
      const base = cycle === 'annual' ? plan.baseAnnual : plan.baseMonthly;
      setAmount(base);
      setTitle(`${plan.name} ${cycle === 'annual' ? 'Annual' : 'Monthly'} Membership Proposal for ${lead.name}`);
    }
  };

  const netPayable = Math.max(0, Number(amount) - Number(discountAmount));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a quotation title.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Quote amount must be a positive number.');
      return;
    }

    if (!validUntil) {
      setErrorMessage('Please specify quotation validity expiration date.');
      return;
    }

    setLoading(true);
    try {
      const created = await createLeadQuotation(lead.id, {
        title: title.trim(),
        planId,
        amount: numAmount,
        discountAmount: Number(discountAmount) || 0,
        validUntil,
        terms: terms.trim()
      });

      if (onQuotationCreated) {
        onQuotationCreated(created);
      }
      onClose();
    } catch (err) {
      console.error('Quotation error:', err);
      setErrorMessage(err.message || 'Failed to dispatch quotation. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010b07]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#041c14] border border-emerald-900/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-emerald-900/40 bg-[#02140e]/95 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#fcfaf5]">Generate Membership Quotation</h3>
              <p className="text-xs text-emerald-300/70">
                Visitor: <strong className="text-white">{lead.name}</strong> ({lead.email})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-[#07261c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Plan Tier Selector */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1.5">
              Select Membership Tier Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePlanChange(p.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    planId === p.id
                      ? 'btn-champagne font-bold shadow-md shadow-[#dfc99a]/10'
                      : 'bg-[#02140e] border-emerald-900/50 text-emerald-300/80 hover:border-emerald-700/60 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-xs">{p.tier} Tier</span>
                  <span className="text-[10px] opacity-75 font-mono">₹{billingCycle === 'annual' ? p.baseAnnual : p.baseMonthly}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quotation Title */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Quotation Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-emerald-300 font-semibold mb-1">
                Plan Gross Amount (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="100"
                step="50"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white font-mono focus:outline-none focus:border-[#dfc99a]"
              />
            </div>

            <div>
              <label className="block text-emerald-300 font-semibold mb-1">
                Special Introductory Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white font-mono focus:outline-none focus:border-[#dfc99a]"
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Quotation Valid Until <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Proposal Terms & Notes */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">
              Proposal Terms, Inclusions & Perks
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white placeholder-emerald-700/50 focus:outline-none focus:border-[#dfc99a]"
            />
          </div>

          {/* Net Amount Preview */}
          <div className="p-3.5 bg-[#02140e] border border-emerald-900/60 rounded-2xl flex items-center justify-between">
            <span className="text-emerald-300 font-semibold">Net Proposed Total:</span>
            <span className="text-base font-mono font-bold text-[#dfc99a]">
              ₹{netPayable.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-emerald-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#07261c] hover:bg-[#0b3829] text-emerald-300 border border-emerald-800/60 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 btn-champagne font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/15 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Quote...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send Quotation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
