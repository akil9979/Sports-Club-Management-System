import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = null, children = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#02140e] flex items-center justify-center text-[#fcfaf5]">
        <div className="flex flex-col items-center gap-3 bg-[#041c14]/90 p-8 rounded-3xl border border-emerald-900/50 shadow-2xl backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-[#dfc99a] animate-spin" />
          <span className="text-sm font-serif tracking-wide text-emerald-200">Verifying Session Authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const allowed = user?.role === 'admin' || roles.includes(user?.role);
    if (!allowed) {
      return (
        <div className="min-h-screen bg-[#02140e] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#041c14] border border-emerald-900/60 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-[#dfc99a] mx-auto" />
            <h2 className="text-xl font-serif font-bold text-[#fcfaf5]">Access Restricted</h2>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              Your current membership / staff credential (<span className="text-[#dfc99a] font-mono font-semibold uppercase">{user?.role || 'user'}</span>) does not have privilege to enter this sector.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link to="/" className="px-4 py-2 text-xs font-semibold bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 border border-emerald-800/60 rounded-xl transition">
                Home
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="px-4 py-2 text-xs font-bold btn-champagne rounded-xl transition">
                  Admin Dashboard
                </Link>
              )}
              {['staff', 'manager'].includes(user?.role) && (
                <Link to="/staff/bar" className="px-4 py-2 text-xs font-bold btn-champagne rounded-xl transition">
                  Staff Portal
                </Link>
              )}
              {user?.role === 'member' && (
                <Link to="/members" className="px-4 py-2 text-xs font-bold btn-champagne rounded-xl transition">
                  Member Portal
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  return children || <Outlet />;
}

