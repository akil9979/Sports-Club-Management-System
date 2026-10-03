import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { isValidEmail } from '../../features/auth/authApi.js';
import { 
  Trophy, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Wine,
  User,
  KeyRound,
  Sparkles,
  CheckCircle2,
  Crown
} from 'lucide-react';

const ROLE_CONFIGS = {
  member: {
    id: 'member',
    label: 'Member Login',
    tagline: 'Club member access & court reservations',
    icon: User,
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    demoEmail: 'devon.conway@example.com',
    demoPassword: 'Password@123',
    demoLabel: 'Devon Conway (Gold Member)',
    defaultTarget: '/members'
  },
  staff: {
    id: 'staff',
    label: 'Staff Portal',
    tagline: 'Bar POS, kitchen order queue & inventory',
    icon: Wine,
    badgeColor: 'bg-[#dfc99a]/15 text-[#dfc99a] border-[#dfc99a]/30',
    demoEmail: 'priya.nair@championsclub.com',
    demoPassword: 'Password@123',
    demoPin: '1234',
    demoLabel: 'Priya Nair (Staff / Bar Lead)',
    defaultTarget: '/staff/bar'
  },
  admin: {
    id: 'admin',
    label: 'Admin Portal',
    tagline: 'Executive management, user roles & analytics',
    icon: ShieldCheck,
    badgeColor: 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/40',
    demoEmail: 'admin@championsclub.com',
    demoPassword: 'Password@123',
    demoLabel: 'Club Administrator',
    defaultTarget: '/admin'
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, pinLogin, isAuthenticated, user } = useAuth();

  const [activeRole, setActiveRole] = useState('member');
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'pin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine redirect path upon login
  const getDestination = (userRole) => {
    if (location.state?.from?.pathname) {
      return location.state.from.pathname;
    }
    if (userRole === 'admin') return '/admin';
    if (['staff', 'manager'].includes(userRole)) return '/staff/bar';
    return '/members';
  };

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getDestination(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Handle Staff PIN login mode
    if (activeRole === 'staff' && authMode === 'pin') {
      if (!pin.trim()) {
        setError('Please enter your 4-digit staff PIN');
        return;
      }
      setLoading(true);
      try {
        const res = await pinLogin({ pin: pin.trim() });
        navigate(getDestination(res.data?.user?.role || 'staff'), { replace: true });
      } catch (err) {
        setError(err.message || 'Invalid PIN code');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle Standard Password Login
    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email, password });
      const userRole = res.data?.user?.role || 'member';
      navigate(getDestination(userRole), { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (roleKey) => {
    setActiveRole(roleKey);
    setError('');
    const config = ROLE_CONFIGS[roleKey];
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
    if (config.demoPin) setPin(config.demoPin);
  };

  const currentConfig = ROLE_CONFIGS[activeRole];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#02140e] text-[#f4efe4]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f7f1e3] via-[#dfc99a] to-[#c59e4b] p-0.5 shadow-xl shadow-[#dfc99a]/10">
              <div className="w-full h-full rounded-[10px] bg-[#02140e] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-[#dfc99a] stroke-[2.2]" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            The Champions <span className="champagne-gradient-text font-black">Club</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#ede0c4]/70 mt-1 font-medium">
            Authenticated Access Gateway
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#041c14] rounded-2xl border border-[#dfc99a]/20 mb-4 shadow-xl">
          {Object.values(ROLE_CONFIGS).map((cfg) => {
            const Icon = cfg.icon;
            const isSelected = activeRole === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => handleSelectRole(cfg.id)}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#f7f1e3] to-[#dfc99a] text-[#02140e] shadow-md shadow-[#dfc99a]/20 scale-[1.02]'
                    : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#07261c]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cfg.label.replace(' Login', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl border border-[#dfc99a]/25">
          {/* Active Role Subheader */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#dfc99a]/15">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{currentConfig.label}</span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                  {activeRole.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#ede0c4]/70 mt-0.5">{currentConfig.tagline}</p>
            </div>

            {/* Staff PIN Toggle */}
            {activeRole === 'staff' && (
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'password' ? 'pin' : 'password')}
                className="text-[11px] font-bold text-[#dfc99a] hover:text-[#f7f1e3] underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{authMode === 'password' ? 'Use Staff PIN' : 'Use Password'}</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeRole === 'staff' && authMode === 'pin' ? (
              /* Staff PIN Input */
              <div>
                <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">
                  4-Digit Terminal PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                  <input
                    id="login-pin-input"
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={loading}
                    placeholder="e.g. 1234"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-base tracking-widest text-white focus:outline-none focus:border-[#dfc99a] text-center font-mono"
                  />
                </div>
                <p className="text-[11px] text-[#ede0c4]/60 mt-1">Default staff terminal demo PIN: <code className="text-[#dfc99a] font-mono font-bold">1234</code></p>
              </div>
            ) : (
              /* Email & Password Input */
              <>
                <div>
                  <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                    <input
                      id="login-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#ede0c4] uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#dfc99a]/70" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#02140e] border border-[#dfc99a]/25 text-sm text-white focus:outline-none focus:border-[#dfc99a] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#ede0c4]/60 hover:text-white"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="btn-champagne w-full mt-3 py-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#02140e]" />
              ) : (
                <span>Sign In as {activeRole.toUpperCase()}</span>
              )}
              <ArrowRight className="w-4 h-4 text-[#02140e]" />
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-[#dfc99a]/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#ede0c4] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#dfc99a]" />
                <span>Instant Demo Fill:</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(ROLE_CONFIGS).map((cfg) => (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => handleSelectRole(cfg.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    activeRole === cfg.id
                      ? 'bg-[#06261b] border-[#dfc99a]/50 text-[#dfc99a]'
                      : 'bg-[#02140e] border-[#dfc99a]/15 text-[#ede0c4]/70 hover:text-white hover:border-[#dfc99a]/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-white uppercase text-[10px] tracking-wider">{cfg.id}</span>
                    {activeRole === cfg.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#dfc99a]" />}
                  </div>
                  <span className="text-[11px] truncate text-[#ede0c4] mt-1">{cfg.demoLabel.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#ede0c4]/70 mt-6">
          New member?{' '}
          <Link to="/signup" className="text-[#dfc99a] hover:text-[#f7f1e3] font-bold underline ml-1">
            Register New Account
          </Link>
        </p>
      </div>
    </div>
  );
}
