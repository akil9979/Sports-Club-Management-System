import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { updateMember } from './membershipApi.js';
import { validateMemberProfile } from './memberValidation.js';

export default function MemberProfileEditModal({ isOpen, member, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Other',
    address: '',
    emergencyContact: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        gender: member.gender || 'Other',
        address: member.address || '',
        emergencyContact: member.emergencyContact || ''
      });
      setFormErrors({});
      setApiError(null);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const validation = validateMemberProfile(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateMember(member.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim()
      });

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update member profile:', err);
      setApiError(err.message || 'Unable to update member profile. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02140e]/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#041c14] border border-emerald-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-emerald-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                {member.memberNumber || member.id}
              </span>
              <h3 className="text-xl font-serif font-bold text-[#fcfaf5] tracking-tight">Edit Member Profile</h3>
            </div>
            <p className="text-xs text-emerald-300/70 mt-1">
              Update contact information and personal details for {member.name}.
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

        {/* API Error Notification */}
        {apiError && (
          <div className="mt-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300">
              <span className="font-semibold block mb-0.5">Profile Update Failed</span>
              {apiError}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Devon Conway"
              className={`w-full px-4 py-2.5 bg-[#02140e]/90 border rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 transition-all ${
                formErrors.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-emerald-900/60 focus:border-[#dfc99a]'
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-400">{formErrors.name}</p>
            )}
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="devon@example.com"
                className={`w-full px-4 py-2.5 bg-[#02140e]/90 border rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 transition-all ${
                  formErrors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-emerald-900/60 focus:border-[#dfc99a]'
                }`}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-rose-400">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+919876543210"
                className={`w-full px-4 py-2.5 bg-[#02140e]/90 border rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 transition-all ${
                  formErrors.phone ? 'border-rose-500/80 focus:border-rose-500' : 'border-emerald-900/60 focus:border-[#dfc99a]'
                }`}
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-rose-400">{formErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Gender & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#02140e]/90 border border-emerald-900/60 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 focus:border-[#dfc99a] transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
                Emergency Contact
              </label>
              <input
                type="tel"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="+919876500001"
                className="w-full px-4 py-2.5 bg-[#02140e]/90 border border-emerald-900/60 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 focus:border-[#dfc99a] transition-all"
              />
            </div>
          </div>

          {/* Residential Address */}
          <div>
            <label className="block text-xs font-semibold text-emerald-300/80 uppercase tracking-wider mb-1.5">
              Address / Residence
            </label>
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="House/Apartment, Street, City"
              className="w-full px-4 py-2 bg-[#02140e]/90 border border-emerald-900/60 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-[#dfc99a]/40 focus:border-[#dfc99a] transition-all resize-none"
            />
          </div>

          {/* Read-only audit notice */}
          <div className="p-3 bg-[#02140e]/70 rounded-xl border border-emerald-900/60 flex items-center justify-between text-xs text-emerald-300/70">
            <div>
              <span className="font-semibold text-emerald-200">Date of Birth:</span>{' '}
              {member.dob ? new Date(member.dob).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not recorded'}
            </div>
            <span className="text-[11px] text-emerald-500/70 italic">
              DOB locked for plan qualification
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-900/40">
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
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-champagne font-bold text-xs shadow-lg shadow-[#dfc99a]/15 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#02140e] shrink-0" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
