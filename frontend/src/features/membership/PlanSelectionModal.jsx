import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import PlanCardsSelector from './PlanCardsSelector.jsx';
import { assignMembership, getMembershipPlans } from './membershipApi.js';
import { calculateAge } from './memberValidation.js';

export default function PlanSelectionModal({ isOpen, member, onClose, onSuccess }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('gold');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch plans when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoadingPlans(true);
      getMembershipPlans()
        .then((fetchedPlans) => {
          setPlans(fetchedPlans);
          // If member already has an active plan, preselect that or default to gold
          if (member?.activeMembership?.planId) {
            setSelectedPlanId(member.activeMembership.planId);
          } else if (fetchedPlans.length > 0) {
            setSelectedPlanId(fetchedPlans[0].id);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load membership plans from backend.');
        })
        .finally(() => {
          setLoadingPlans(false);
        });

      // Default start date
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(todayStr);
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const memberAge = member.dob ? calculateAge(member.dob) : null;
  const isJuniorAttempt = selectedPlanId.toLowerCase().includes('junior');
  const juniorIneligible = isJuniorAttempt && memberAge !== null && memberAge >= 18;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedPlanId) {
      setError('Please select a membership plan.');
      return;
    }

    if (juniorIneligible) {
      setError(`Cannot assign Junior Plan: Member is ${memberAge} years old (Junior requires under 18). Please select Gold or Silver.`);
      return;
    }

    if (!startDate) {
      setError('Please specify a membership start date.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await assignMembership(member.id, {
        planId: selectedPlanId,
        billingCycle,
        startDate,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined
      });

      if (onSuccess) {
        onSuccess(response.member, response.membership);
      }
      onClose();
    } catch (err) {
      console.error('Failed to assign membership:', err);
      setError(err.message || 'Failed to activate membership. Please verify parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02140e]/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#041c14] border border-emerald-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-emerald-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                {member.memberNumber || member.id}
              </span>
              <h3 className="text-xl font-serif font-bold text-[#fcfaf5] tracking-tight">
                {member.activeMembership ? 'Renew or Upgrade Membership' : 'Activate New Membership Plan'}
              </h3>
            </div>
            <p className="text-xs text-emerald-300/70 mt-1">
              Select tier, billing schedule, and payment details for <strong className="text-emerald-100">{member.name}</strong>
              {memberAge !== null && ` (Age: ${memberAge} yrs)`}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#07261c] hover:bg-[#0b3829] text-emerald-400 hover:text-white flex items-center justify-center transition-colors border border-emerald-800/60"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300">
              <span className="font-semibold block mb-0.5">Membership Assignment Error</span>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Plan Selector with backend data */}
          <PlanCardsSelector
            plans={plans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              setError(null);
            }}
            billingCycle={billingCycle}
            onBillingCycleChange={setBillingCycle}
            memberDob={member.dob}
            loading={loadingPlans}
          />

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#02140e]/70 border border-emerald-900/60">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Effective Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#07261c] border border-emerald-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 focus:border-[#dfc99a]"
                required
              />
              <span className="text-[10px] text-emerald-500/70 mt-1 block">
                Expiry calculated automatically by backend.
              </span>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#07261c] border border-emerald-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 focus:border-[#dfc99a]"
              >
                <option value="upi">UPI (GPay / PhonePe / QR)</option>
                <option value="card">Credit / Debit Card POS</option>
                <option value="cash">Front Desk Cash</option>
                <option value="cheque">Bank Transfer / Cheque</option>
              </select>
              <span className="text-[10px] text-emerald-500/70 mt-1 block">
                Recorded for member billing ledger.
              </span>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Payment Ref / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-192837 or Receipt #54"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#07261c] border border-emerald-800/60 rounded-xl text-xs text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 focus:border-[#dfc99a]"
              />
              <span className="text-[10px] text-emerald-500/70 mt-1 block">
                Optional transaction or receipt reference.
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-emerald-900/40">
            <div className="text-xs text-emerald-400/70">
              Prices & discounts are managed strictly by backend policy.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50 border border-emerald-800/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loadingPlans || juniorIneligible}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-champagne font-bold text-xs shadow-lg shadow-[#dfc99a]/15 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#02140e] shrink-0" />
                    <span>Confirming Subscription...</span>
                  </>
                ) : (
                  'Confirm & Activate Plan'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
