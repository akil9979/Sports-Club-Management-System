import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = null, requiredPermissions = null, children = null }) {
  const { isAuthenticated, isLoading, user, can, hasAnyPermission } = useAuth();
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

  // 1. Role validation
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
                <Link to="/staff/operations" className="px-4 py-2 text-xs font-bold btn-champagne rounded-xl transition">
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

  // 2. Fine-grained Job-Based Access Control permission validation
  if (requiredPermissions && user?.role !== 'admin') {
    const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasPerm = perms.some((p) => can(p));
    if (!hasPerm) {
      return (
        <div className="min-h-screen bg-[#02140e] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#041c14] border border-rose-900/60 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
            <h2 className="text-xl font-serif font-bold text-[#fcfaf5]">Job Permission Required</h2>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              Your staff assignment (<span className="text-[#dfc99a] font-semibold">{user?.staffJob?.name || 'Staff'}</span>) does not have permission to access this module.
            </p>
            <p className="text-[11px] font-mono text-emerald-500/80">
              Required: {perms.join(' or ')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link to="/staff/operations" className="px-4 py-2 text-xs font-bold btn-champagne rounded-xl transition">
                Return to Operations
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children || <Outlet />;
}

