import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Send, 
  Building2, 
  ShieldCheck, 
  CreditCard, 
  AlertCircle, 
  X, 
  Check, 
  Download, 
  Sparkles 
} from 'lucide-react';
import { getPayrollSummary, disbursePayroll } from '../../features/management/managementApi.js';
import { formatCurrency } from '../../features/management/managementValidation.js';

export default function StaffPayrollSection({ onPayrollUpdated }) {
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Disbursement Form
  const [disburseForm, setDisburseForm] = useState({
    department: 'all',
    paymentMethod: 'bank_transfer',
    notes: 'End of month salary wire transfer distribution.',
    periodName: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
  });

  const loadPayroll = async () => {
    setLoading(true);
    try {
      const data = await getPayrollSummary('month');
      setPayrollData(data);
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const handleDisburse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await disbursePayroll(disburseForm);
      setIsDisburseModalOpen(false);
      setActionSuccess(`Payroll for ${disburseForm.periodName} disbursed successfully!`);
      await loadPayroll();
      if (onPayrollUpdated) onPayrollUpdated();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to disburse payroll');
    } finally {
      setSubmitting(false);
    }
  };

  if (!payrollData && loading) {
    return (
      <div className="p-8 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 animate-pulse text-center text-[#ede0c4]/40">
        Loading Staff Payroll Roster & Wage Calculator...
      </div>
    );
  }

  const employees = payrollData?.employees || [];
  const departments = payrollData?.departments || [];
  const recentPayouts = payrollData?.recentPayouts || [];
  const totalPayroll = payrollData?.totalGrossPayroll || 0;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#031811] border border-[#dfc99a]/20 shadow-xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Staff Compensation & Payroll Engine
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            Employees Compensation & Payroll Payouts
          </h3>
          <p className="text-xs text-[#ede0c4]/60 mt-0.5">
            Calculate base salaries, accrued hourly shift wages, and disburse month-end staff payroll
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDisburseModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-400 text-[#02140e] hover:bg-emerald-300 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <CreditCard className="w-4 h-4" />
          <span>Process & Disburse Payroll</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#02140e] border border-emerald-900/40">
          <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider block">Total Monthly Gross Payroll</span>
          <span className="text-2xl font-black text-emerald-300">{formatCurrency(totalPayroll)}</span>
          <span className="text-[11px] text-[#ede0c4]/50 block mt-0.5">Base salaries + hourly shift earnings</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15">
          <span className="text-[10px] font-bold text-[#ede0c4]/60 uppercase tracking-wider block">Active Headcount</span>
          <span className="text-2xl font-black text-white">{payrollData?.activeHeadcount || employees.length} Staff</span>
          <span className="text-[11px] text-[#ede0c4]/50 block mt-0.5">Across {departments.length} departments</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#02140e] border border-amber-900/40">
          <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider block">Department Budget Breakdown</span>
          <div className="flex items-center gap-2 mt-1">
            {departments.slice(0, 3).map((d) => (
              <span key={d.department} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#031811] text-[#ede0c4]/80 border border-[#dfc99a]/15">
                {d.department}: {formatCurrency(d.totalSalary)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Payroll Roster */}
      <div className="overflow-x-auto rounded-2xl border border-[#dfc99a]/15">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#02140e] border-b border-[#dfc99a]/15 text-[#dfc99a] uppercase tracking-wider font-semibold">
              <th className="p-3.5">Emp ID</th>
              <th className="p-3.5">Employee Name</th>
              <th className="p-3.5">Department & Role</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5 text-right">Base Salary</th>
              <th className="p-3.5 text-right">Shift Hours</th>
              <th className="p-3.5 text-right">Total Payable</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfc99a]/10 bg-[#031811]/60">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-[#02140e]/80 transition-colors">
                <td className="p-3.5 font-mono font-bold text-[#ede0c4]/80">{emp.employeeNumber || emp.id}</td>
                <td className="p-3.5">
                  <div className="font-bold text-white">{emp.name}</div>
                  <div className="text-[11px] text-[#ede0c4]/50">{emp.email}</div>
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-[#dfc99a] uppercase text-[10px]">{emp.department}</div>
                  <div className="text-slate-300">{emp.designation}</div>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                    {emp.employmentType}
                  </span>
                </td>
                <td className="p-3.5 text-right text-slate-200">
                  {emp.baseSalary > 0 ? formatCurrency(emp.baseSalary) : 'Hourly Basis'}
                </td>
                <td className="p-3.5 text-right text-cyan-300 font-mono">
                  {emp.hoursWorked || 0} hrs
                </td>
                <td className="p-3.5 text-right">
                  <span className="text-sm font-black text-emerald-400">
                    {formatCurrency(emp.totalPayable)}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    emp.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DISBURSEMENT MODAL */}
      {isDisburseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#031811] border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#dfc99a]/15 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Process Staff Payroll</h3>
                <p className="text-xs text-emerald-300 mt-0.5">Authorizes salary expense and payouts</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="p-2 rounded-xl text-[#ede0c4]/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                  Department Scope
                </label>
                <select
                  value={disburseForm.department}
                  onChange={(e) => setDisburseForm({ ...disburseForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                >
                  <option value="all">All Departments (Entire Staff)</option>
                  <option value="management">Management Only</option>
                  <option value="bar">Bar & Lounge Operations</option>
                  <option value="reception">Front Desk & Concierge</option>
                  <option value="sports_academy">Sports Academy & Coaches</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                  Payment Method
                </label>
                <select
                  value={disburseForm.paymentMethod}
                  onChange={(e) => setDisburseForm({ ...disburseForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                >
                  <option value="bank_transfer">Corporate Bank Wire / Direct Deposit</option>
                  <option value="cheque">Company Cheque</option>
                  <option value="cash">Cash Payroll Disbursal</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#ede0c4]/80 block mb-1">
                  Period Reference
                </label>
                <input
                  type="text"
                  value={disburseForm.periodName}
                  onChange={(e) => setDisburseForm({ ...disburseForm, periodName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02140e] border border-[#dfc99a]/20 text-xs text-white focus:border-[#dfc99a] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#02140e] border border-[#dfc99a]/15 text-xs space-y-1">
                <span className="text-[#ede0c4]/60 block">Total Disbursal Amount:</span>
                <span className="text-xl font-black text-emerald-400 block">{formatCurrency(totalPayroll)}</span>
                <span className="text-[10px] text-[#ede0c4]/40 block">Will automatically record an authorized salary expense entry.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dfc99a]/15">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ede0c4]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-400 text-[#02140e] hover:bg-emerald-300 active:scale-95 transition"
                >
                  {submitting ? 'Processing...' : 'Confirm Disbursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
