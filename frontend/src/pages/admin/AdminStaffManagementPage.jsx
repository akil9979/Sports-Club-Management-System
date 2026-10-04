import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Edit2,
  Power,
  X,
  Loader2,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import {
  getAdminStaffMembers,
  getStaffJobTypes,
  updateAdminStaffMemberJob,
  updateAdminStaffMemberStatus
} from '../../features/auth/authApi.js';

export default function AdminStaffManagementPage() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJob, setFilterJob] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Change Job Modal State
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [targetJobId, setTargetJobId] = useState('');
  const [submittingJobChange, setSubmittingJobChange] = useState(false);

  // Fetch staff and available job types
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setFeedback(null);
    try {
      const [staffRes, jobsRes] = await Promise.all([
        getAdminStaffMembers(),
        getStaffJobTypes()
      ]);
      setStaffMembers(staffRes || []);
      setJobTypes(jobsRes || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load staff records' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Change Job Modal
  const handleOpenJobModal = (staff) => {
    setSelectedStaff(staff);
    setTargetJobId(staff.staffJobTypeId || '');
    setIsJobModalOpen(true);
  };

  // Submit Job Change
  const handleConfirmJobChange = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !targetJobId) return;

    setSubmittingJobChange(true);
    try {
      await updateAdminStaffMemberJob(selectedStaff.id, targetJobId);
      const chosenJob = jobTypes.find(j => j.id === targetJobId);
      setFeedback({
        type: 'success',
        message: `Successfully updated ${selectedStaff.firstName}'s staff job to "${chosenJob?.name || 'New Job'}". Permissions adjusted immediately.`
      });
      setIsJobModalOpen(false);
      fetchData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update staff job' });
    } finally {
      setSubmittingJobChange(false);
    }
  };

  // Toggle Staff Active / Inactive Status
  const handleToggleStatus = async (staff) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminStaffMemberStatus(staff.id, newStatus);
      setFeedback({
        type: 'success',
        message: `Staff member ${staff.firstName} ${staff.lastName} set to ${newStatus.toUpperCase()}.`
      });
      fetchData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update staff status' });
    }
  };

  // Filtered staff list
  const filteredStaff = staffMembers.filter((s) => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''} ${s.email || ''} ${s.employeeId || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());
    const matchesJob = filterJob === 'all' || s.staffJobCode === filterJob || s.staffJobTypeId === filterJob;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesJob && matchesStatus;
  });

  // Metrics
  const totalStaff = staffMembers.length;
  const activeStaffCount = staffMembers.filter((s) => s.status === 'active').length;
  const assignedJobsCount = new Set(staffMembers.map((s) => s.staffJobTypeId).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#02140e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#dfc99a]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] flex items-center justify-center shadow-xl shadow-[#dfc99a]/15">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#fcfaf5] tracking-tight">
                    Staff Management
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 uppercase">
                    Access Control
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-300/70 mt-1">
                  Assign Staff Jobs, govern duty status, and monitor fine-grained operational authorizations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={loading || refreshing}
                className="px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 border border-emerald-800/60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#dfc99a]' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link
                to="/admin/staff-jobs"
                className="px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Manage Staff Job Types</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>

              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-xl btn-champagne text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/15"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#02140e]" />
                <span>Admin Command</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Staff Enrolled</span>
              <Users className="w-4 h-4 text-[#dfc99a]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#fcfaf5]">{totalStaff}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Active employment roster</span>
          </div>

          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Duty Personnel</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-emerald-300">{activeStaffCount}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Authorized terminal logins</span>
          </div>

          <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-400/70 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Distinct Job Assignments</span>
              <Briefcase className="w-4 h-4 text-[#dfc99a]" />
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#dfc99a]">{assignedJobsCount}</div>
            <span className="text-[11px] text-emerald-500/70 mt-1 block">Active job categories in use</span>
          </div>
        </div>

        {/* Main Roster & Staff Management Section */}
        <div className="bg-[#041c14]/90 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/40">
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#dfc99a]" />
                <span>Club Staff Directory</span>
              </h2>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                Select a staff member to alter their assigned Staff Job or toggle terminal activation.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff name, email..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-white placeholder-emerald-700/60 focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              <select
                value={filterJob}
                onChange={(e) => setFilterJob(e.target.value)}
                aria-label="Filter staff by job"
                className="px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-white focus:outline-none focus:border-[#dfc99a]"
              >
                <option value="all">All Staff Jobs</option>
                {jobTypes.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter staff by status"
                className="px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-xs text-white focus:outline-none focus:border-[#dfc99a]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-emerald-400">
              <Loader2 className="w-8 h-8 text-[#dfc99a] animate-spin" />
              <span className="text-sm font-serif">Loading Staff Personnel Database...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-emerald-500/70 text-xs">
              No staff members found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-900/40 text-emerald-400/70 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Staff Member</th>
                    <th className="py-3 px-3">Employee ID</th>
                    <th className="py-3 px-3">Assigned Staff Job</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/30">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-[#07261c]/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] font-bold flex items-center justify-center border border-[#dfc99a]/30 text-xs">
                            {staff.firstName ? staff.firstName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {staff.firstName} {staff.lastName}
                            </div>
                            <span className="text-[10px] text-emerald-400/70 font-mono">
                              {staff.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-emerald-300">
                        {staff.employeeId || 'STF-EMP'}
                      </td>

                      <td className="py-3.5 px-3">
                        {staff.staffJobName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 font-bold">
                            <Briefcase className="w-3 h-3" />
                            <span>{staff.staffJobName}</span>
                          </span>
                        ) : (
                          <span className="text-amber-400/80 font-medium">
                            No Job Assigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          staff.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {staff.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenJobModal(staff)}
                            className="px-3 py-1.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-xs font-semibold text-[#dfc99a] border border-emerald-800/60 transition flex items-center gap-1.5 active:scale-95"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Change Job</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(staff)}
                            className={`p-1.5 rounded-xl border transition ${
                              staff.status === 'active'
                                ? 'bg-[#07261c] text-emerald-400 hover:bg-rose-500/20 hover:text-rose-300 border-emerald-800/60'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
                            }`}
                            title={staff.status === 'active' ? 'Deactivate Staff' : 'Activate Staff'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CHANGE STAFF JOB (DYNAMIC RADIO BUTTONS FROM DATABASE) */}
      {isJobModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-[#02140e]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#041c14] border border-[#dfc99a]/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#dfc99a]" />
                  <span>Assign Staff Job</span>
                </h3>
                <p className="text-xs text-emerald-300/70 mt-0.5">
                  Changing job updates operational permissions instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="p-1 rounded-lg text-emerald-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#02140e] border border-emerald-900/60">
              <div className="text-xs text-emerald-400/80">Staff Member:</div>
              <div className="text-sm font-bold text-white">
                {selectedStaff.firstName} {selectedStaff.lastName}
              </div>
              <div className="text-[11px] text-[#dfc99a] mt-0.5 font-mono">
                Current: {selectedStaff.staffJobName || 'None'}
              </div>
            </div>

            <form onSubmit={handleConfirmJobChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                  Select New Staff Job:
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {jobTypes.map((job) => {
                    const isSelected = targetJobId === job.id;
                    return (
                      <label
                        key={job.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#07261c] border-[#dfc99a] text-white shadow-md shadow-[#dfc99a]/10'
                            : 'bg-[#02140e]/70 border-emerald-900/50 text-emerald-300/80 hover:bg-[#07261c]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="staffJobRadio"
                          value={job.id}
                          checked={isSelected}
                          onChange={() => setTargetJobId(job.id)}
                          className="mt-0.5 accent-[#dfc99a]"
                        />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>{job.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400/60">{job.code}</span>
                          </div>
                          {job.description && (
                            <p className="text-[11px] text-emerald-400/70 mt-0.5 leading-relaxed">
                              {job.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#07261c] text-emerald-300 hover:text-white border border-emerald-800/60 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJobChange || !targetJobId}
                  className="px-5 py-2 rounded-xl btn-champagne font-bold text-[#02140e] text-xs shadow-lg shadow-[#dfc99a]/15 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingJobChange && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Job Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
