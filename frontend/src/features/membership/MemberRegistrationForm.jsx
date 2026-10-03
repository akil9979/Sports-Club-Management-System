import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import PlanCardsSelector from './PlanCardsSelector.jsx';
import { getMembershipPlans, registerMember } from './membershipApi.js';
import { validateMemberRegistration, calculateAge } from './memberValidation.js';

const TODAY_DATE = new Date().toISOString().split('T')[0];

export default function MemberRegistrationForm({ onSuccess, className = '' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPlanId = searchParams.get('planId') || searchParams.get('tier');

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Male',
    address: '',
    emergencyContact: '',
    planId: urlPlanId || 'gold',
    billingCycle: 'monthly',
    startDate: TODAY_DATE,
    paymentMethod: 'upi'
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMember, setSuccessMember] = useState(null);

  // Load plans from backend
  useEffect(() => {
    let isMounted = true;
    getMembershipPlans()
      .then((data) => {
        if (isMounted) {
          setPlans(data);
          if (data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              planId: prev.planId || data[0].id
            }));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load plans:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingPlans(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError(null);
  };

  const handlePlanSelect = (planId) => {
    setFormData((prev) => ({ ...prev, planId }));
    if (formErrors.planId) {
      setFormErrors((prev) => ({ ...prev, planId: undefined }));
    }
  };

  const handleBillingCycleChange = (billingCycle) => {
    setFormData((prev) => ({ ...prev, billingCycle }));
  };

  // Demo Presets to quickly test requirements & edge cases
  const applyPreset = (type) => {
    const today = new Date().toISOString().split('T')[0];
    setApiError(null);

    if (type === 'gold_adult') {
      setFormData({
        name: 'Rohan Mehra',
        email: `rohan.mehra_${Date.now().toString().slice(-4)}@example.com`,
        phone: '+919876112233',
        dob: '1992-05-18', // 34 years old
        gender: 'Male',
        address: 'Flat 402, Palm Springs Residency, Ahmedabad',
        emergencyContact: '+919876000088',
        planId: 'gold',
        billingCycle: 'monthly',
        startDate: today,
        paymentMethod: 'upi'
      });
      setFormErrors({});
    } else if (type === 'silver_adult') {
      setFormData({
        name: 'Ananya Deshmukh',
        email: `ananya.deshmukh_${Date.now().toString().slice(-4)}@example.com`,
        phone: '+919876223344',
        dob: '1996-11-24', // 30 years old
        gender: 'Female',
        address: 'B-12 Greenwood Enclave, Ahmedabad',
        emergencyContact: '+919876000077',
        planId: 'silver',
        billingCycle: 'annual',
        startDate: today,
        paymentMethod: 'card'
      });
      setFormErrors({});
    } else if (type === 'junior_valid') {
      setFormData({
        name: 'Kabir Patel',
        email: `kabir.patel_${Date.now().toString().slice(-4)}@example.com`,
        phone: '+919876334455',
        dob: '2012-08-14', // 14 years old (Under 18 -> Valid Junior!)
        gender: 'Male',
        address: '15 Lotus Court, Ahmedabad',
        emergencyContact: '+919876550011 (Parent: Rajesh Patel)',
        planId: 'junior',
        billingCycle: 'monthly',
        startDate: today,
        paymentMethod: 'upi'
      });
      setFormErrors({});
    } else if (type === 'junior_invalid_age') {
      // EDGE CASE: 25 years old attempting Junior plan
      setFormData({
        name: 'Vikram Sethi (Adult)',
        email: `vikram.adult_${Date.now().toString().slice(-4)}@example.com`,
        phone: '+919876445566',
        dob: '2001-03-10', // 25 years old -> INVALID for Junior!
        gender: 'Male',
        address: '88 Skyline Towers, Ahmedabad',
        emergencyContact: '+919876000044',
        planId: 'junior',
        billingCycle: 'monthly',
        startDate: today,
        paymentMethod: 'cash'
      });
      setFormErrors({});
    } else if (type === 'duplicate_email') {
      // EDGE CASE: Pre-existing email of Devon Conway
      setFormData({
        name: 'Devon Conway Clone',
        email: 'devon.conway@crickettech.nz', // Existing email in database
        phone: '+919876543299',
        dob: '1991-07-08',
        gender: 'Male',
        address: 'Auckland / Ahmedabad',
        emergencyContact: '+919876000001',
        planId: 'gold',
        billingCycle: 'monthly',
        startDate: today,
        paymentMethod: 'card'
      });
      setFormErrors({});
    }
  };

  const calculatedAge = formData.dob ? calculateAge(formData.dob) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMember(null);

    // Run client-side validation
    const validation = validateMemberRegistration(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validation.errors)[0];
      const element = document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await registerMember({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dob: formData.dob,
        gender: formData.gender,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        planId: formData.planId,
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        paymentMethod: formData.paymentMethod
      });

      setSuccessMember(response.member);
      if (onSuccess) {
        onSuccess(response.member);
      } else {
        // Automatically navigate to member profile page after brief delay
        setTimeout(() => {
          navigate(`/members/${response.member.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setApiError(err.message || 'Registration failed. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Quick Demo Preset Bar for rapid testing */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quick Test Scenarios & Edge Cases
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            One-click test dataset auto-population
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => applyPreset('gold_adult')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
          >
            Adult Gold (Monthly)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('silver_adult')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Adult Silver (Annual)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('junior_valid')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
          >
            Junior Valid (Age 14)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('junior_invalid_age')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            title="Tests edge case: Age 25 attempting to subscribe to Junior Plan"
          >
            Edge Case: Junior Age Guard (Age 25)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('duplicate_email')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors"
            title="Tests edge case: Registering with an already existing member email"
          >
            Edge Case: Duplicate Email (409)
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMember && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">
              Member Registered Successfully!
            </h4>
            <p className="text-xs text-slate-300">
              Welcome, <strong className="text-white">{successMember.name}</strong>! Member ID{' '}
              <span className="font-mono font-bold text-amber-400">{successMember.memberNumber || successMember.id}</span> has been created with an active{' '}
              <strong className="text-white">{successMember.activeMembership?.tier || 'Membership'}</strong> plan.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/members/${successMember.id}`)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Go to Member Profile &rarr;
              </button>
              <span className="text-[11px] text-slate-400">
                Redirecting automatically in a moment...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300">
            <span className="font-bold text-sm block mb-1">Registration Error</span>
            <p className="leading-relaxed">{apiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Personal Identification */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="pb-4 mb-6 border-b border-slate-800/80">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">
                01
              </span>
              Member Personal & Contact Information
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Required for club identity records, access verification, and security compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Full Name */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Devon Conway"
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  formErrors.name ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500/60'
                }`}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-rose-400">{formErrors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="member@example.com"
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  formErrors.email ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500/60'
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-rose-400">{formErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+919876543210"
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  formErrors.phone ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500/60'
                }`}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-rose-400">{formErrors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Date of Birth <span className="text-rose-400">*</span>
                </label>
                {calculatedAge !== null && (
                  <span className="text-[11px] font-semibold text-amber-400">
                    Age: {calculatedAge} years
                  </span>
                )}
              </div>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={TODAY_DATE}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  formErrors.dob ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500/60'
                }`}
              />
              {formErrors.dob ? (
                <p className="mt-1 text-xs text-rose-400">{formErrors.dob}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Required to determine Junior tier eligibility (&lt;18 yrs).
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Gender Identity
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="+919876500000"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Recommended for injury or court emergency.
              </p>
            </div>

            {/* Residential Address */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Residential Address / Locality
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 42 Riverside Boulevard, Bodakdev, Ahmedabad"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Membership Tier Selection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="pb-4 mb-6 border-b border-slate-800/80">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">
                02
              </span>
              Membership Plan & Benefits Selection
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select tier entitlement. Pricing and benefits are supplied directly from backend policy.
            </p>
          </div>

          {/* Validation error for plan */}
          {formErrors.planId && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formErrors.planId}</span>
            </div>
          )}

          {/* Plan Cards Component */}
          <PlanCardsSelector
            plans={plans}
            selectedPlanId={formData.planId}
            onSelectPlan={handlePlanSelect}
            billingCycle={formData.billingCycle}
            onBillingCycleChange={handleBillingCycleChange}
            memberDob={formData.dob}
            loading={loadingPlans}
          />
        </div>

        {/* SECTION 3: Payment & Activation Schedule */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
          <div className="pb-4 mb-6 border-b border-slate-800/80">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-mono">
                03
              </span>
              Activation & Payment Settlement
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Specify effective start date and front desk settlement mode.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Effective Start Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  formErrors.startDate ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500/60'
                }`}
              />
              {formErrors.startDate && (
                <p className="mt-1 text-xs text-rose-400">{formErrors.startDate}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                End date is computed strictly by backend based on billing cycle.
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Settlement Channel
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 transition-all"
              >
                <option value="upi">UPI (Google Pay, PhonePe, Paytm QR)</option>
                <option value="card">Credit / Debit Card (Front Desk Terminal)</option>
                <option value="cash">Cash Settlement (Club Counter)</option>
                <option value="cheque">Cheque / Direct Bank Transfer</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Receipt reference will be generated upon confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="text-xs text-slate-400">
            By registering, the member agrees to The Champions Club bylaws and facility code of conduct.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || loadingPlans}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950 shrink-0" />
                  <span>Processing Registration...</span>
                </>
              ) : (
                <>
                  <span>Register & Activate Membership</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
