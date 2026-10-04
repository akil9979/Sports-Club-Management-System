import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  ShieldCheck,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Users,
  KeyRound,
  RefreshCw,
  X,
  Power,
  Loader2,
  Lock,
  ArrowLeft,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  getAdminStaffJobs,
  getAdminPermissions,
  createAdminStaffJob,
  updateAdminStaffJob
} from '../../features/auth/authApi.js';

export default function AdminStaffJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [permissionsData, setPermissionsData] = useState({ all: [], grouped: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [jobForm, setJobForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    permissions: []
  });

  // Fetch jobs and all available permissions
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setFeedback(null);
    try {
      const [jobsRes, permsRes] = await Promise.all([
        getAdminStaffJobs(),
        getAdminPermissions()
      ]);
      setJobs(jobsRes || []);
      setPermissionsData(permsRes || { all: [], grouped: {} });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load staff jobs' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Add / Edit Modal
  const handleOpenModal = (job = null) => {
    if (job) {
      setEditingJob(job);
      setJobForm({
        code: job.code || '',
        name: job.name || '',
        description: job.description || '',
        isActive: job.isActive !== false,
        permissions: job.permissions || []
      });
    } else {
      setEditingJob(null);
      setJobForm({
        code: '',
        name: '',
        description: '',
        isActive: true,
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  // Toggle permission checkbox in form
  const handleTogglePermission = (permCode) => {
    setJobForm((prev) => {
      const exists = prev.permissions.includes(permCode);
      const nextPerms = exists
        ? prev.permissions.filter((p) => p !== permCode)
        : [...prev.permissions, permCode];
      return { ...prev, permissions: nextPerms };
    });
  };

  // Select / Deselect all in module group
  const handleToggleModuleGroup = (moduleName, groupPerms) => {
    setJobForm((prev) => {
      const allSelected = groupPerms.every((p) => prev.permissions.includes(p.code));
      let nextPerms;
      if (allSelected) {
        // Deselect group
        const groupCodes = new Set(groupPerms.map((p) => p.code));
        nextPerms = prev.permissions.filter((code) => !groupCodes.has(code));
      } else {
        // Select all in group
        const merged = new Set([...prev.permissions, ...groupPerms.map((p) => p.code)]);
        nextPerms = Array.from(merged);
      }
      return { ...prev, permissions: nextPerms };
    });
  };

  // Submit Save Job
  const handleSaveJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editingJob) {
        await updateAdminStaffJob(editingJob.id, {
          name: jobForm.name,
          description: jobForm.description,
          isActive: jobForm.isActive,
          permissions: jobForm.permissions
        });
        setFeedback({
          type: 'success',
          message: `Staff Job "${jobForm.name}" updated successfully!`
        });
      } else {
        // Auto-generate code if empty
        const code = jobForm.code.trim() || jobForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        await createAdminStaffJob({
          code,
          name: jobForm.name,
          description: jobForm.description,
          permissions: jobForm.permissions
        });
        setFeedback({
          type: 'success',
          message: `New Staff Job "${jobForm.name}" created and now available for registration!`
        });
      }
      setIsModalOpen(false);
      fetchData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Job Active Status (Soft Deactivation)
  const handleToggleJobStatus = async (job) => {
    if (job.isActive && parseInt(job.activeStaffCount, 10) > 0) {
      const confirmDeact = window.confirm(
        `Notice: ${job.activeStaffCount} active staff member(s) are currently assigned to "${job.name}". Deactivating this job will not erase their records, but will prevent new assignments. Proceed?`
      );
      if (!confirmDeact) return;
    }
    const newStatus = !job.isActive;
    try {
      await updateAdminStaffJob(job.id, { isActive: newStatus });
      setFeedback({
        type: 'success',
        message: `Staff Job "${job.name}" is now ${newStatus ? 'ACTIVE' : 'DEACTIVATED'}.`
      });
      fetchData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update job status' });
    }
  };

  const grouped = permissionsData.grouped || {};

  return (
    <div className="min-h-screen bg-[#02140e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#dfc99a]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfc99a] via-[#c59e4b] to-[#8c6b24] text-[#02140e] flex items-center justify-center shadow-xl shadow-[#dfc99a]/15">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#fcfaf5] tracking-tight">
                    Staff Job Types & Permissions
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 uppercase">
                    Extensible Schema
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-300/70 mt-1">
                  Define new club job positions, assign operational authorizations, and control role-based privileges.
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
                to="/admin/staff"
                className="px-4 py-2.5 rounded-xl bg-[#07261c] hover:bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Staff Management</span>
              </Link>

              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="px-4 py-2.5 rounded-xl btn-champagne text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/15 hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4 text-[#02140e]" />
                <span>Add Staff Job</span>
              </button>
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

        {/* Scalability Notice Box */}
        <div className="p-4 rounded-2xl bg-[#041c14]/80 border border-[#dfc99a]/25 flex items-start gap-3 text-xs text-emerald-300/80">
          <Sparkles className="w-5 h-5 text-[#dfc99a] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#fcfaf5] block">Scalable Database-Driven Jobs:</span>
            <p className="leading-relaxed">
              New jobs created here immediately appear in the Staff Signup radio list and can be assigned to employees without modifying source code or schema.
            </p>
          </div>
        </div>

        {/* Staff Jobs Cards Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-emerald-400">
            <Loader2 className="w-8 h-8 text-[#dfc99a] animate-spin" />
            <span className="text-sm font-serif">Loading Staff Jobs & Permission Matrix...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => {
              const staffCount = parseInt(job.activeStaffCount, 10) || 0;
              const permsList = job.permissions || [];

              return (
                <div
                  key={job.id}
                  className={`bg-[#041c14]/90 border rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                    job.isActive
                      ? 'border-emerald-900/50 hover:border-[#dfc99a]/50'
                      : 'border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-serif font-bold text-white tracking-wide">
                            {job.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            job.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {job.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#dfc99a] mt-0.5 block">
                          code: {job.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#07261c] border border-emerald-800/60 text-xs text-emerald-200">
                        <Users className="w-3.5 h-3.5 text-[#dfc99a]" />
                        <span className="font-bold">{staffCount}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-emerald-300/70 min-h-[36px] line-clamp-2 leading-relaxed">
                      {job.description || 'No description provided.'}
                    </p>

                    {/* Permission Badges Summary */}
                    <div>
                      <div className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Assigned Permissions ({permsList.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {permsList.length === 0 ? (
                          <span className="text-[10px] text-emerald-700/60 italic">No permissions assigned</span>
                        ) : (
                          permsList.map((perm) => (
                            <span
                              key={perm}
                              className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#02140e] text-emerald-300/90 border border-emerald-900/60"
                            >
                              {perm}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-5 mt-5 border-t border-emerald-900/40 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(job)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#07261c] hover:bg-[#0b3829] text-emerald-200 hover:text-white border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Edit2 className="w-3 h-3 text-[#dfc99a]" />
                      <span>Edit & Perms</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleJobStatus(job)}
                      className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                        job.isActive
                          ? 'bg-[#07261c] hover:bg-rose-500/20 text-emerald-400 hover:text-rose-300 border-emerald-800/60'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                      }`}
                      title={job.isActive ? 'Deactivate Job' : 'Reactivate Job'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{job.isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT STAFF JOB & PERMISSION CHECKBOXES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#02140e]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#041c14] border border-[#dfc99a]/40 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#dfc99a]" />
                  <span>{editingJob ? `Edit Staff Job: ${editingJob.name}` : 'Create New Staff Job'}</span>
                </h3>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  Configure internal job code, description, and fine-grained permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-emerald-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveJob} className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Job Title / Display Name *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.name}
                    onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                    placeholder="e.g. Equipment Manager"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">
                    Internal Identifier Code {editingJob && '(read-only)'}
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingJob)}
                    value={jobForm.code}
                    onChange={(e) => setJobForm({ ...jobForm, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="e.g. equipment_manager"
                    className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a] font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Operational Description</label>
                <textarea
                  rows="2"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="e.g. Manages sports equipment, inventory intake, and equipment stock checks."
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-emerald-900/60 text-white focus:outline-none focus:border-[#dfc99a]"
                />
              </div>

              {/* Grouped Permission Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-emerald-900/40 pb-1.5">
                  <span className="font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#dfc99a]" />
                    <span>Assign Granular Permissions</span>
                  </span>
                  <span className="text-[11px] text-[#dfc99a] font-mono">
                    {jobForm.permissions.length} selected
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries(grouped).map(([moduleName, perms]) => {
                    const allInModuleSelected = perms.every((p) => jobForm.permissions.includes(p.code));
                    return (
                      <div key={moduleName} className="p-3.5 rounded-2xl bg-[#02140e] border border-emerald-900/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white capitalize text-xs tracking-wide">
                            {moduleName.replace(/_/g, ' ')} Module
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleGroup(moduleName, perms)}
                            className="text-[10px] text-[#dfc99a] hover:underline font-semibold"
                          >
                            {allInModuleSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isChecked = jobForm.permissions.includes(p.code);
                            return (
                              <label
                                key={p.code}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition ${
                                  isChecked
                                    ? 'bg-[#07261c] border-[#dfc99a]/50 text-white'
                                    : 'bg-[#041c14] border-emerald-900/40 text-emerald-300/70 hover:bg-[#07261c]/40'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.code)}
                                  className="mt-0.5 accent-[#dfc99a]"
                                />
                                <div>
                                  <div className="font-mono text-[11px] font-bold">
                                    {p.code}
                                  </div>
                                  {p.description && (
                                    <div className="text-[10px] text-emerald-400/60 leading-tight">
                                      {p.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-end gap-2 sticky bottom-0 bg-[#041c14] py-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#07261c] text-emerald-300 hover:text-white border border-emerald-800/60 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !jobForm.name}
                  className="px-5 py-2 rounded-xl btn-champagne font-bold text-[#02140e] text-xs shadow-lg shadow-[#dfc99a]/15 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingJob ? 'Save Changes' : 'Create Job Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
