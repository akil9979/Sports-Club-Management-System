import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  User, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { submitLead } from '../../services/api.js';

/**
 * Pure JavaScript form validation without third-party schema libraries (No Zod/Yup)
 */
function validateEnquiry(formData) {
  const errors = {};

  // Name validation
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
    errors.name = 'Name contains invalid characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!emailRegex.test(formData.email.trim())) {
    errors.email = 'Please enter a valid email address (e.g. name@domain.com)';
  }

  // Phone validation (10+ digits, standard mobile/intl format)
  const phoneClean = (formData.phone || '').replace(/[\s\-()]/g, '');
  if (!formData.phone || !formData.phone.trim()) {
    errors.phone = 'Phone number is required for booking confirmation';
  } else if (!/^\+?[0-9]{10,15}$/.test(phoneClean)) {
    errors.phone = 'Please enter a valid phone number with at least 10 digits';
  }

  // Message validation (required when asking for a quote or custom enquiry)
  if (formData.message && formData.message.trim().length > 0 && formData.message.trim().length < 5) {
    errors.message = 'Please provide a little more detail (at least 5 characters)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export default function EnquiryFormSection({ embedded = false }) {
  const [searchParams] = useSearchParams();

  // Read URL query params if user clicked from a specific court, plan or product
  const queryPlan = searchParams.get('plan') || searchParams.get('tier') || '';
  const queryCourt = searchParams.get('court') || '';
  const queryDate = searchParams.get('date') || '';
  const queryTime = searchParams.get('time') || '';
  const queryProduct = searchParams.get('product') || '';

  const [formData, setFormData] = useState(() => {
    let initialMsg = '';
    if (queryCourt) {
      initialMsg += `I would like to book or hold court slot on ${queryCourt} on ${queryDate} at ${queryTime}. `;
    }
    if (queryProduct) {
      initialMsg += `Inquiry for Pro Shop product: ${queryProduct}. `;
    }
    if (queryPlan) {
      initialMsg += `Interested in ${queryPlan} membership tier. `;
    }

    return {
      name: '',
      email: '',
      phone: '',
      sport: 'Tennis',
      interestTier: queryPlan ? (queryPlan.charAt(0).toUpperCase() + queryPlan.slice(1)) : 'Trial Session',
      message: initialMsg.trim(),
      courtPreference: queryCourt ? `${queryCourt} (${queryDate} @ ${queryTime})` : '',
      productInquiry: queryProduct || ''
    };
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time error clearance
    if (touched[name]) {
      const validation = validateEnquiry({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: validation.errors[name] || null }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validation = validateEnquiry(formData);
    if (validation.errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validation.errors[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      message: true
    });

    const validation = validateEnquiry(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);

    try {
      // Contract payload for POST /api/leads
      const leadPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        sport: formData.sport,
        interestTier: formData.interestTier,
        message: formData.message.trim(),
        source: 'website_trial_cta'
      };

      const res = await submitLead(leadPayload);

      if (res && res.success !== false) {
        setSubmitSuccess({
          leadId: res.leadId || `LEAD-${Date.now().toString(36).toUpperCase()}`,
          message: res.message || 'Enquiry successfully submitted! Our club manager will connect with you shortly.'
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          sport: 'Tennis',
          interestTier: 'Trial Session',
          message: '',
          courtPreference: '',
          productInquiry: ''
        });
        setTouched({});
        setErrors({});
      } else {
        throw new Error(res?.message || 'Submission was rejected by the server.');
      }
    } catch (err) {
      console.error('Enquiry submission failed:', err);
      setSubmitError(err.message || 'Failed to submit enquiry. Please verify details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="enquiry-section" className={`w-full ${embedded ? 'py-4' : 'py-20 bg-slate-900/40 border-t border-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Club Enquiries & Free Trial</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Book a Free Trial Session or Send an Enquiry
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              No lost messages, no unanswered phone calls. Submit your details below to schedule your court trial, 
              request membership onboarding, or reserve pro gear.
            </p>
          </div>

          {/* SUCCESS BANNER STATE */}
          {submitSuccess && (
            <div className="glass-panel p-8 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 to-slate-900 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Confirmation #{submitSuccess.leadId}
                </span>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Enquiry Successfully Received!
                </h3>
                <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  {submitSuccess.message}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Response time: Within 2 hours</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Front desk direct: +91 98765-43210</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSubmitSuccess(null)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Send Another Request
              </button>
            </div>
          )}

          {/* ENQUIRY FORM */}
          {!submitSuccess && (
            <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative">
              {/* Context Banner if Prefilled */}
              {(queryCourt || queryPlan || queryProduct) && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Inquiry pre-filled for:{' '}
                      <strong>{queryCourt || queryPlan || queryProduct}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Active Context</span>
                </div>
              )}

              {/* ERROR ALERT STATE */}
              {submitError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Submission Error: </strong>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label htmlFor="enquiry-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="enquiry-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Vikram Sharma"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input ${
                          errors.name ? 'border-rose-500/80 focus:border-rose-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="enquiry-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="enquiry-email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. vikram@example.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input ${
                          errors.email ? 'border-rose-500/80 focus:border-rose-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label htmlFor="enquiry-phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Phone Number (WhatsApp) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        id="enquiry-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g. +91 98765 43210"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input ${
                          errors.phone ? 'border-rose-500/80 focus:border-rose-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Sport Category */}
                  <div className="space-y-2">
                    <label htmlFor="enquiry-sport" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Sport of Primary Interest
                    </label>
                    <select
                      id="enquiry-sport"
                      name="sport"
                      value={formData.sport}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-sm glass-input bg-slate-900"
                    >
                      <option value="Tennis">Tennis (Hard & Red Clay)</option>
                      <option value="Cricket">Box Cricket (Indoor Turfs)</option>
                      <option value="Padel">Padel (Panoramic Glass)</option>
                      <option value="Multi-Sport">Multi-Sport / All Access</option>
                    </select>
                  </div>
                </div>

                {/* Membership Tier / Trial Interest */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    What are you looking for?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'Trial Session', label: 'Free Trial Session' },
                      { id: 'Gold', label: 'Gold Tier Plan' },
                      { id: 'Silver', label: 'Silver Tier Plan' },
                      { id: 'Junior', label: 'Junior (U18) Tier' },
                    ].map((tier) => (
                      <label
                        key={tier.id}
                        className={`px-3 py-3 rounded-xl border text-xs font-semibold cursor-pointer text-center transition-all flex items-center justify-center ${
                          formData.interestTier === tier.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold shadow-md'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="interestTier"
                          value={tier.id}
                          checked={formData.interestTier === tier.id}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span>{tier.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Message Field */}
                <div className="space-y-2">
                  <label htmlFor="enquiry-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Message or Special Requests <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="enquiry-message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Specify preferred timing, coaching inquiries, stringing requests, or any questions for the club staff..."
                      className={`w-full p-4 rounded-xl text-sm glass-input ${
                        errors.message ? 'border-rose-500/80 focus:border-rose-500' : ''
                      }`}
                    />
                  </div>
                  {errors.message && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Sending to Front Desk...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Enquiry & Book Trial</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-500 mt-3">
                    Your inquiry goes directly into The Champions Club digital dispatch board. We respect your privacy.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
