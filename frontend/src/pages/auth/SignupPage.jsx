import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { isValidEmail } from '../../features/auth/authApi.js';
import { Trophy, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Crown } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'member'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/members', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName.trim()) return setError('First name is required');
    if (!form.lastName.trim()) return setError('Last name is required');
    if (!form.email.trim() || !isValidEmail(form.email)) return setError('Valid email is required');
    if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role
      });
      navigate('/members', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#02140e] text-[#f4efe4]">
      <div className="w-full max-w-lg">
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
