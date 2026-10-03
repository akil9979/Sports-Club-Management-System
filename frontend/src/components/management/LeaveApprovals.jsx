import React, { useState } from 'react';
import { 
  CalendarOff, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  FileText, 
  Loader2, 
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { approveLeaveRequest, rejectLeaveRequest } from '../../features/management/managementApi.js';

/**
 * LeaveApprovals Component
 * Allows managers to review pending employee leave requests and execute
 * approvals or rejections with MANDATORY modal confirmation.
 */
export default function LeaveApprovals({ leaveRequests = [], onLeaveUpdated }) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [confirmModal, setConfirmModal] = useState(null); // { request, action: 'approve' | 'reject' }
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const pendingRequests = leaveRequests.filter((r) => r.status === 'pending');
  const displayedRequests = activeTab === 'pending' ? pendingRequests : leaveRequests;

  const handleOpenConfirm = (request, action) => {
    setActionError(null);
    setActionSuccess(null);
    setConfirmModal({ request, action });
  };

  const handleExecuteAction = async () => {
    if (!confirmModal) return;
    const { request, action } = confirmModal;
    setProcessingId(request.id);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (action === 'approve') {
        await approveLeaveRequest(request.id, true);
        setActionSuccess(`Leave request for ${request.employeeName} has been approved.`);
      } else {
        await rejectLeaveRequest(request.id, true);
        setActionSuccess(`Leave request for ${request.employeeName} has been rejected.`);
      }
      setConfirmModal(null);
      if (onLeaveUpdated) {
        await onLeaveUpdated();
      }
    } catch (err) {
      setActionError(err.message || `Failed to ${action} leave request.`);
    } finally {
      setProcessingId(null);
    }
  };

  const getLeaveTypeBadge = (type) => {
    switch (type) {
      case 'sick':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">Sick Leave</span>;
      case 'casual':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">Casual Leave</span>;
      case 'emergency':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">Emergency</span>;
      case 'annual':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">Annual Leave</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400"><Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Review</span>;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <CalendarOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Staff Leave Approvals
              {pendingRequests.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[11px] font-extrabold flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#ede0c4]/60">
              Review and act on employee leave requests with mandatory authorization
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-[#02140e] p-1 rounded-2xl border border-[#dfc99a]/15">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-[#dfc99a] text-[#02140e] shadow-md'
                : 'text-[#ede0c4]/70 hover:text-white'
            }`}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-[#dfc99a] text-[#02140e] shadow-md'
                : 'text-[#ede0c4]/70 hover:text-white'
            }`}
          >
            All Requests ({leaveRequests.length})
          </button>
        </div>
      </div>

      {/* Action Notification Feedbacks */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Requests List */}
      {displayedRequests.length > 0 ? (
        <div className="space-y-4">
          {displayedRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isProcessing = processingId === req.id;

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 hover:border-[#dfc99a]/35 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Request Details */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{req.employeeName}</span>
                    <span className="text-[10px] font-mono text-[#ede0c4]/50">ID: {req.employeeId}</span>
                    <span className="text-[10px] uppercase font-bold text-[#dfc99a] px-2 py-0.5 rounded-md bg-[#031811] border border-[#dfc99a]/15">
                      {req.department}
                    </span>
                    {getLeaveTypeBadge(req.leaveType)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#ede0c4]/70">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#dfc99a]" />
                      <strong>{req.startDate}</strong> to <strong>{req.endDate}</strong>
                      <span className="text-white/40">({req.daysCount} days)</span>
                    </span>
                    <span className="text-[11px] text-[#ede0c4]/50">
                      Applied: {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  {req.reason && (
                    <div className="text-xs text-slate-300 bg-[#031811]/80 p-2.5 rounded-xl border border-[#dfc99a]/10 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#ede0c4]/40 shrink-0 mt-0.5" />
                      <span>{req.reason}</span>
                    </div>
                  )}
                </div>

                {/* Status or Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleOpenConfirm(req, 'reject')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleOpenConfirm(req, 'approve')}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </>
                  ) : (
                    <div className="text-right">
                      {getStatusBadge(req.status)}
                      {req.approvedBy && (
                        <span className="text-[10px] text-[#ede0c4]/40 block mt-0.5">
                          By: {req.approvedBy}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 text-[#ede0c4]/50">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
          <p className="text-xs font-medium text-slate-300">
            {activeTab === 'pending' ? 'No pending leave approvals!' : 'No leave records found.'}
          </p>
          <p className="text-[11px] text-[#ede0c4]/40 mt-1">
            All employee leave applications are currently up-to-date.
          </p>
        </div>
      )}

      {/* MANDATORY Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#031811] border border-[#dfc99a]/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                confirmModal.action === 'approve'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}>
                {confirmModal.action === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Confirm Leave {confirmModal.action === 'approve' ? 'Approval' : 'Rejection'}
                </h4>
                <p className="text-xs text-[#ede0c4]/60">Action cannot be undone without administrator override</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-[#ede0c4]/60">Employee:</span>
                <strong className="text-white">{confirmModal.request.employeeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#ede0c4]/60">Department:</span>
                <span className="capitalize">{confirmModal.request.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#ede0c4]/60">Leave Period:</span>
                <span>{confirmModal.request.startDate} to {confirmModal.request.endDate} ({confirmModal.request.daysCount} days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#ede0c4]/60">Type:</span>
                <span className="capitalize font-semibold text-[#dfc99a]">{confirmModal.request.leaveType}</span>
              </div>
            </div>

            <p className="text-xs text-[#ede0c4]/70">
              Are you sure you want to <strong className={confirmModal.action === 'approve' ? 'text-emerald-400' : 'text-rose-400'}>{confirmModal.action.toUpperCase()}</strong> this leave request for {confirmModal.request.employeeName}?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#02140e] border border-[#dfc99a]/20 text-[#ede0c4]/70 hover:text-white hover:border-[#dfc99a]/40 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId !== null}
                onClick={handleExecuteAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg ${
                  confirmModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                }`}
              >
                {processingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    Confirm {confirmModal.action === 'approve' ? 'Approval' : 'Rejection'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
