import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * ProtectedRoute component
 * 
 * Guards routes requiring authentication.
 * Optional allowedRoles: Array or comma-delimited roles permitted.
 * Redirects unauthenticated users to /login preserving target location.
 */
export default function ProtectedRoute({ allowedRoles = null, children = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="flex flex-col items-center gap-4 bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <div className="text-center">
            <h3 className="font-semibold text-white tracking-wide">Verifying Club Session</h3>
            <p className="text-xs text-slate-400 mt-1">Checking secure credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles) {
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = user?.role;
    const hasPermission = userRole === 'admin' || rolesArray.includes(userRole);

    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
          <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Access Restricted</h2>
              <p className="text-sm text-slate-400 mt-1.5">
                Your role (<span className="text-rose-400 font-semibold uppercase text-xs">{userRole || 'Unknown'}</span>)
                does not have permission to view this staff or administrative area.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href="/"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Return to Home
              </a>
              <a
                href="/membership"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                View Member Desk
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
}
