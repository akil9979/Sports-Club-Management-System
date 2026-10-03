import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = null, children = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium">Verifying Session...</span>
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-400">Your role ({user?.role}) does not have permission to access this area.</p>
            <div className="flex justify-center gap-2">
              <Link to="/" className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Home</Link>
              <Link to="/members" className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-slate-950 rounded-lg">Members</Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children || <Outlet />;
}
