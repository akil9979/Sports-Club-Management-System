import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { isValidEmail, getStaffJobTypes } from '../../features/auth/authApi.js';
import { Trophy, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Briefcase } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, role: userRole } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'member',
    staffJobTypeId: ''
  });

  const [staffJobs, setStaffJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (['staff', 'manager', 'admin'].includes(userRole)) {
        navigate('/staff', { replace: true });
      } else {
        navigate('/members', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  // Fetch active staff jobs dynamically from API/database
  useEffect(() => {
    async function loadJobs() {
      setLoadingJobs(true);
      try {
        const jobs = await getStaffJobTypes();
        setStaffJobs(jobs);
        if (jobs.length > 0 && !form.staffJobTypeId) {
          setForm(prev => ({ ...prev, staffJobTypeId: jobs[0].id }));
        }
      } catch (err) {
        console.error('Failed to load staff jobs:', err);
      } finally {
        setLoadingJobs(false);
      }
    }
    loadJobs();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole) => {
    setForm(prev => ({
      ...prev,
      role: newRole,
      staffJobTypeId: newRole === 'staff' && !prev.staffJobTypeId && staffJobs.length > 0
        ? staffJobs[0].id
        : prev.staffJobTypeId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName.trim()) return setError('First name is required');
    if (!form.lastName.trim()) return setError('Last name is required');
    if (!form.email.trim() || !isValidEmail(form.email)) return setError('Valid email is required');
    if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    if (form.role === 'staff' && !form.staffJobTypeId) {
      return setError('Please select a Staff Job for staff account registration');
    }

    setLoading(true);
    try {
      const res = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        staffJobTypeId: form.role === 'staff' ? form.staffJobTypeId : null
      });

      if (form.role === 'staff') {
        navigate('/staff', { replace: true });
      } else {
        navigate('/members', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#02140e] text-[#f4efe4]">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] p-0.5 shadow-xl shadow-[#dfc99a]/10">
              <div className="w-full h-full rounded-[10px] bg-[#02140e] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#dfc99a] stroke-[2.2]" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Create Your <span className="champagne-gradient-text">Club Account</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#ede0c4]/70 mt-2">Join The Champions Club Community</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dfc99a]/25">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-2">
                Account Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition ${
                    form.role === 'member'
                      ? 'bg-[#dfc99a]/15 border-[#dfc99a] text-[#dfc99a] shadow-md shadow-[#dfc99a]/10'
                      : 'bg-[#02140e] border-[#dfc99a]/25 text-[#ede0c4]/70 hover:border-[#dfc99a]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={form.role === 'member'}
                    onChange={() => handleRoleChange('member')}
                    className="accent-[#dfc99a] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold block text-white">Club Member</span>
                    <span className="text-[11px] text-[#ede0c4]/60 block">Play, book & dine</span>
                  </div>
                </label>

                <label
                  className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition ${
                    form.role === 'staff'
                      ? 'bg-[#dfc99a]/15 border-[#dfc99a] text-[#dfc99a] shadow-md shadow-[#dfc99a]/10'
                      : 'bg-[#02140e] border-[#dfc99a]/25 text-[#ede0c4]/70 hover:border-[#dfc99a]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="staff"
                    checked={form.role === 'staff'}
                    onChange={() => handleRoleChange('staff')}
                    className="accent-[#dfc99a] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold block text-white">Staff Member</span>
                    <span className="text-[11px] text-[#ede0c4]/60 block">Club operations lead</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditionally Rendered Staff Job Radio Options (Dynamic from DB) */}
            {form.role === 'staff' && (
              <div className="p-4 rounded-2xl bg-[#041c14] border border-[#dfc99a]/35 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#dfc99a] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span>Assigned Staff Job *</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Database Driven
                  </span>
                </div>
                <p className="text-[11px] text-[#ede0c4]/70">
                  Select your operational department job. Permissions and accessible club modules update automatically based on this selection.
                </p>

                {loadingJobs ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-emerald-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#dfc99a]" />
                    <span>Loading available staff jobs from server...</span>
                  </div>
                ) : staffJobs.length === 0 ? (
                  <div className="text-xs text-rose-300 py-2">
                    No active staff jobs found. Please contact an administrator.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {staffJobs.map((job) => (
                      <label
                        key={job.id}
                        className={`cursor-pointer p-3 rounded-xl border flex items-start gap-2.5 transition text-left ${
                          form.staffJobTypeId === job.id
                            ? 'bg-[#dfc99a]/20 border-[#dfc99a] text-white shadow-sm'
                            : 'bg-[#02140e] border-emerald-900/60 text-emerald-200/80 hover:border-[#dfc99a]/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="staffJobTypeId"
                          value={job.id}
                          checked={form.staffJobTypeId === job.id}
                          onChange={() => setForm({ ...form, staffJobTypeId: job.id })}
                          className="accent-[#dfc99a] w-4 h-4 mt-0.5 shrink-0 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white leading-tight">{job.name}</div>
                          {job.description && (
                            <div className="text-[10px] text-emerald-400/60 leading-tight mt-1 line-clamp-2">
                              {job.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">First Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                  <input
                    id="signup-firstname-input"
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="John"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">Last Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                  <input
                    id="signup-lastname-input"
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                <input
                  id="signup-email-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                <input
                  id="signup-phone-input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a]"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                  <input
                    id="signup-password-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Min 6 chars"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#ede0c4]/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                  <input
                    id="signup-confirmpassword-input"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a] font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              id="signup-submit-button"
              type="submit"
              disabled={loading}
              className="btn-champagne w-full mt-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#02140e]" /> : <span>Create Account</span>}
              <ArrowRight className="w-4 h-4 text-[#02140e]" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#ede0c4]/70 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#dfc99a] hover:text-[#f7f1e3] font-bold underline ml-1">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
