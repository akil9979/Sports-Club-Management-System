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
  Lock,
  DollarSign
} from 'lucide-react';


const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin (Full Access)', color: 'bg-[#dfc99a]/15 text-[#dfc99a] border-[#dfc99a]/30' },
  { value: 'manager', label: 'Manager (Operations Lead)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { value: 'staff', label: 'Staff (Bar & POS)', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  { value: 'member', label: 'Member (Club Member)', color: 'bg-slate-700/40 text-slate-200 border-slate-600/40' },
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
    <div className="min-h-screen bg-[#02140e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] flex items-center justify-center shadow-xl shadow-[#dfc99a]/15">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#fcfaf5] tracking-tight">
                    Admin Executive Control
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                    SUPERADMIN
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-300/70 mt-1">
                  Logged in as <strong className="text-[#fcfaf5]">{user?.firstName} {user?.lastName}</strong> ({user?.email})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 border border-emerald-800/60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#dfc99a]' : ''}`} />
                <span>Refresh Data</span>
              </button>
              <Link
                to="/management"
                className="px-4 py-2.5 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 hover:bg-[#dfc99a]/25 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Month-End Financials</span>
              </Link>
              <Link
                to="/staff/bar"
                className="px-4 py-2.5 rounded-xl btn-champagne text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/15 hover:scale-105 transition-all"
              >
                <Wine className="w-3.5 h-3.5 text-[#02140e]" />
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
          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-[#dfc99a]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#fcfaf5]">{totalUsers}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Registered in database</span>
          </div>

          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Administrators</span>
              <ShieldCheck className="w-4 h-4 text-[#dfc99a]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#dfc99a]">{adminCount}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Full club privileges</span>
          </div>

          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Operations Staff</span>
              <Wine className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-emerald-300">{staffCount}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">POS, bar & courts</span>
          </div>

          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
              <UserCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-teal-300">{memberCount}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Court & member tier access</span>
          </div>
        </div>

        {/* Quick Portal Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link
            to="/management"
            className="group bg-[#041c14]/90 border border-[#dfc99a]/30 hover:border-[#dfc99a] rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#07261c] text-[#dfc99a] border border-[#dfc99a]/40 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-[#dfc99a] transition-colors">Month-End Hub</span>
                <span className="text-[11px] text-[#dfc99a]/70 block">P&L, Taxes & Payroll</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:text-[#dfc99a] transition-colors" />
          </Link>

          <Link
            to="/staff/bar"
            className="group bg-[#041c14]/90 border border-emerald-900/40 hover:border-[#dfc99a]/50 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#07261c] text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center">
                <Wine className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-[#dfc99a] transition-colors">Bar & POS</span>
                <span className="text-[11px] text-emerald-400/60 block">Tabs & kitchen</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:text-[#dfc99a] transition-colors" />
          </Link>

          <Link
            to="/members"
            className="group bg-[#041c14]/90 border border-emerald-900/40 hover:border-[#dfc99a]/50 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#07261c] text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-[#dfc99a] transition-colors">Members</span>
                <span className="text-[11px] text-emerald-400/60 block">Directory & tiers</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:text-[#dfc99a] transition-colors" />
          </Link>

          <Link
            to="/courts"
            className="group bg-[#041c14]/90 border border-emerald-900/40 hover:border-[#dfc99a]/50 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#07261c] text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-[#dfc99a] transition-colors">Courts</span>
                <span className="text-[11px] text-emerald-400/60 block">Slot schedule</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:text-[#dfc99a] transition-colors" />
          </Link>

          <Link
            to="/shop"
            className="group bg-[#041c14]/90 border border-emerald-900/40 hover:border-[#dfc99a]/50 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#07261c] text-[#dfc99a] border border-[#dfc99a]/30 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-[#dfc99a] transition-colors">Pro Shop</span>
                <span className="text-[11px] text-emerald-400/60 block">Stock & orders</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:text-[#dfc99a] transition-colors" />
          </Link>
        </div>


        {/* Role Capability Comparison Matrix */}
        <div className="bg-[#041c14]/70 border border-emerald-900/40 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-base font-serif font-bold text-[#fcfaf5] mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#dfc99a]" />
            <span>Role-Based Access Matrix</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#07261c] border border-[#dfc99a]/30">
              <span className="font-bold text-[#dfc99a] text-sm block mb-1">👑 Admin Role</span>
              <p className="text-xs text-emerald-300/70 leading-relaxed">
                Full system control. Can view all operational modules, modify user roles, override booking rules, access POS terminals, and review club finances.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#07261c] border border-emerald-800/60">
              <span className="font-bold text-emerald-300 text-sm block mb-1">👔 Staff / Manager Role</span>
              <p className="text-xs text-emerald-300/70 leading-relaxed">
                Operations access. Can operate POS Bar terminal, advance kitchen orders, manage low-stock inventory, and verify member check-ins.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#07261c] border border-teal-800/60">
              <span className="font-bold text-teal-300 text-sm block mb-1">🎾 Member Role</span>
              <p className="text-xs text-emerald-300/70 leading-relaxed">
                Club client access. Can book courts with tier discounts, view profile & membership status, browse pro shop with member discounts, and view public desk.
              </p>
            </div>
          </div>
        </div>

        {/* User Management & Role Assignment Table */}
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-900/40">
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#fcfaf5] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#dfc99a]" />
                <span>User Role Management</span>
              </h2>
              <p className="text-xs text-emerald-300/70 mt-0.5">
                Assign and update access roles in real-time. Changes take effect immediately.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email..."
                className="px-3.5 py-2 rounded-xl bg-[#02140e]/90 border border-emerald-900/60 text-xs text-white placeholder-emerald-700/60 focus:outline-none focus:border-[#dfc99a] flex-1 sm:w-60"
              />
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                aria-label="Filter users by role"
                className="px-3 py-2 rounded-xl bg-[#02140e]/90 border border-emerald-900/60 text-xs text-white focus:outline-none focus:border-[#dfc99a] shrink-0"
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
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-emerald-400">
              <Loader2 className="w-8 h-8 text-[#dfc99a] animate-spin" />
              <span className="text-sm">Loading user database...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-emerald-500/70 text-sm">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-900/40 text-emerald-400/70 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Current Role</th>
                    <th className="py-3 px-3">Member / Staff Ref</th>
                    <th className="py-3 px-3">Modify Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {filteredUsers.map(u => {
                    const isUpdating = updatingId === u.id;
                    const roleConfig = ROLE_OPTIONS.find(r => r.value === u.role) || {
                      color: 'bg-[#07261c] text-emerald-400 border-emerald-800/60'
                    };

                    return (
                      <tr key={u.id} className="hover:bg-[#07261c]/40 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#dfc99a]/15 text-[#dfc99a] font-bold flex items-center justify-center border border-[#dfc99a]/30 text-xs">
                              {u.firstName ? u.firstName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                              <span className="text-[10px] text-emerald-500/70">ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-emerald-100">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${roleConfig.color}`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-emerald-400/70">
                          {u.memberNumber ? (
                            <span className="text-[#dfc99a] font-mono">{u.memberNumber}</span>
                          ) : u.employeeId || u.department ? (
                            <span className="text-emerald-300">{u.designation || u.department || 'Staff'}</span>
                          ) : (
                            <span className="text-emerald-700/60">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              disabled={isUpdating}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              aria-label={`Change role for ${u.firstName} ${u.lastName}`}
                              className="px-2.5 py-1.5 rounded-lg bg-[#02140e] border border-emerald-800/60 text-xs text-white focus:outline-none focus:border-[#dfc99a] disabled:opacity-50"
                            >
                              {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {isUpdating && <Loader2 className="w-4 h-4 text-[#dfc99a] animate-spin shrink-0" />}
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
