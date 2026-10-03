import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { getAdminUsers, updateUserRole } from '../../features/auth/authApi.js';
import {
  ShieldCheck,
  Users,
  Wine,
  Calendar,
  ShoppingBag,
  CreditCard,
  UserCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Lock
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin (Full Access)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { value: 'manager', label: 'Manager (Operations Lead)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { value: 'staff', label: 'Staff (Bar & POS)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'member', label: 'Member (Club Member)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { value: 'coach', label: 'Coach (Academy)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' }
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getAdminUsers();
      setUsersList(data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setFeedback(null);
    try {
      await updateUserRole(userId, newRole);
      setUsersList(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setFeedback({
        type: 'success',
        message: `Successfully updated user role to "${newRole.toUpperCase()}"`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update user role'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      (u.firstName + ' ' + u.lastName + ' ' + u.email + ' ' + (u.memberNumber || ''))
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Metrics
  const totalUsers = usersList.length;
  const adminCount = usersList.filter(u => u.role === 'admin').length;
  const staffCount = usersList.filter(u => ['staff', 'manager'].includes(u.role)).length;
  const memberCount = usersList.filter(u => u.role === 'member').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Admin Executive Control
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    SUPERADMIN
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Logged in as <strong className="text-white">{user?.firstName} {user?.lastName}</strong> ({user?.email})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
                <span>Refresh Data</span>
              </button>
              <Link
                to="/staff/bar"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
              >
                <Wine className="w-3.5 h-3.5" />
                <span>Staff Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 text-sm animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalUsers}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Registered in database</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Administrators</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-400">{adminCount}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Full club privileges</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Operations Staff</span>
              <Wine className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">{staffCount}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">POS, bar & courts</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{memberCount}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Court & member tier access</span>
          </div>
        </div>

        {/* Quick Portal Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/staff/bar"
            className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Wine className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Bar & POS Terminal</span>
                <span className="text-[11px] text-slate-400 block">Manage tabs & kitchen</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          <Link
            to="/members"
            className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Member Directory</span>
                <span className="text-[11px] text-slate-400 block">Profiles & subscriptions</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          <Link
            to="/courts"
            className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Court Availability</span>
                <span className="text-[11px] text-slate-400 block">Slot schedule & booking</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>

          <Link
            to="/shop"
            className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Pro Shop & Inventory</span>
                <span className="text-[11px] text-slate-400 block">Stock & order fulfillment</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>

        {/* Role Capability Comparison Matrix */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>Role-Based Access Matrix</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
              <span className="font-bold text-purple-300 text-sm block mb-1">👑 Admin Role</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full system control. Can view all operational modules, modify user roles, override booking rules, access POS terminals, and review club finances.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20">
              <span className="font-bold text-amber-300 text-sm block mb-1">👔 Staff / Manager Role</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operations access. Can operate POS Bar terminal, advance kitchen orders, manage low-stock inventory, and verify member check-ins.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
              <span className="font-bold text-emerald-300 text-sm block mb-1">🎾 Member Role</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Club client access. Can book courts with tier discounts, view profile & membership status, browse pro shop with member discounts, and view public desk.
              </p>
            </div>
          </div>
        </div>

        {/* User Management & Role Assignment Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>User Role Management</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign and update access roles in real-time. Changes take effect immediately.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email..."
                className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-60"
              />
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                aria-label="Filter users by role"
                className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="member">Member</option>
                <option value="coach">Coach</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-sm">Loading user database...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Current Role</th>
                    <th className="py-3 px-3">Member / Staff Ref</th>
                    <th className="py-3 px-3">Modify Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map(u => {
                    const isUpdating = updatingId === u.id;
                    const roleConfig = ROLE_OPTIONS.find(r => r.value === u.role) || {
                      color: 'bg-slate-800 text-slate-300 border-slate-700'
                    };

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center border border-purple-500/30 text-xs">
                              {u.firstName ? u.firstName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                              <span className="text-[10px] text-slate-500">ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-300">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${roleConfig.color}`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-400">
                          {u.memberNumber ? (
                            <span className="text-emerald-400 font-mono">{u.memberNumber}</span>
                          ) : u.employeeId || u.department ? (
                            <span className="text-amber-400">{u.designation || u.department || 'Staff'}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              disabled={isUpdating}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              aria-label={`Change role for ${u.firstName} ${u.lastName}`}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                            >
                              {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {isUpdating && <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
