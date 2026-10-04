import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Calendar, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Wine, 
  CalendarCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ChevronRight, 
  FileText, 
  ReceiptText, 
  CreditCard, 
  Share2, 
  Printer, 
  DollarSign, 
  Plus 
} from 'lucide-react';
import { 
  getDashboardSummary, 
  getOwnerSummary, 
  getRevenueReport, 
  getCourtUsageReport, 
  getMembershipsReport, 
  getSalesReport, 
  getEmployees, 
  getShifts, 
  getLeaveRequests 
} from '../../features/management/managementApi.js';
import { validatePeriod, SUPPORTED_PERIODS } from '../../features/management/managementValidation.js';

// Subcomponents
import KPICards from '../../components/management/KPICards.jsx';
import OwnerFinancialOverview from '../../components/management/OwnerFinancialOverview.jsx';
import ClientInvoicingSection from '../../components/management/ClientInvoicingSection.jsx';
import StaffPayrollSection from '../../components/management/StaffPayrollSection.jsx';
import TaxReportingSection from '../../components/management/TaxReportingSection.jsx';
import ExecutiveBriefingModal from '../../components/management/ExecutiveBriefingModal.jsx';
import RevenueBySourceSection from '../../components/management/RevenueBySourceSection.jsx';
import CourtUsageSection from '../../components/management/CourtUsageSection.jsx';
import MembershipSummarySection from '../../components/management/MembershipSummarySection.jsx';
import ShopBarSummarySection from '../../components/management/ShopBarSummarySection.jsx';
import FinancialIndicators from '../../components/management/FinancialIndicators.jsx';
import EmployeeTable from '../../components/management/EmployeeTable.jsx';
import ShiftOverview from '../../components/management/ShiftOverview.jsx';
import LeaveApprovals from '../../components/management/LeaveApprovals.jsx';

/**
 * ManagementDashboardPage
 * 
 * Flagship Executive Command Center & Month-End Financial Hub for the Club Owner and Managers:
 * - Answers: How much did we earn, from where & by what method, and what do we owe?
 * - Invoices individual members and corporate/business clients
 * - Disburses staff compensation and calculates payroll
 * - Reviews and approves employee leaves
 * - Audits GST/VAT output and input tax credits for month-end tax filing
 * - Shares numbers via formatted WhatsApp/Email briefing, PDF print, and CSV pack
 */
export default function ManagementDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('owner_overview'); // 'owner_overview' | 'invoicing' | 'payroll' | 'taxes' | 'retail_courts' | 'staff_leaves' | 'all'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Master Data State
  const [ownerSummaryData, setOwnerSummaryData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [courtData, setCourtData] = useState(null);
  const [membershipData, setMembershipData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch all management & owner datasets in parallel with partial failure resilience
  const loadDashboardData = useCallback(async (period, isManualRefresh = false) => {
    const periodCheck = validatePeriod(period);
    if (!periodCheck.isValid) {
      setError(periodCheck.error);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const safeFetch = async (fn, fallback) => {
      try {
        return await fn();
      } catch (err) {
        console.warn('Partial API response warning:', err);
        return fallback;
      }
    };

    try {
      const [
        ownerRes,
        summaryRes,
        revenueRes,
        courtRes,
        membershipRes,
        salesRes,
        employeesRes,
        shiftsRes,
        leaveRes
      ] = await Promise.all([
        safeFetch(() => getOwnerSummary(period), null),
        safeFetch(() => getDashboardSummary(period), null),
        safeFetch(() => getRevenueReport(period), null),
        safeFetch(() => getCourtUsageReport(period), null),
        safeFetch(() => getMembershipsReport(period), null),
        safeFetch(() => getSalesReport(period), null),
        safeFetch(() => getEmployees(), []),
        safeFetch(() => getShifts(), []),
        safeFetch(() => getLeaveRequests(), [])
      ]);

      setOwnerSummaryData(ownerRes);
      setSummaryData(summaryRes);
      setRevenueData(revenueRes || summaryRes);
      setCourtData(courtRes);
      setMembershipData(membershipRes);
      setSalesData(salesRes);
      setEmployees(employeesRes);
      setShifts(shiftsRes);
      setLeaveRequests(leaveRes);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Error communicating with server. Using cached operational data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(selectedPeriod);
  }, [selectedPeriod, loadDashboardData]);

  const handleLeaveUpdated = async () => {
    try {
      const [updatedLeaves, updatedEmployees] = await Promise.all([
        getLeaveRequests(),
        getEmployees()
      ]);
      setLeaveRequests(updatedLeaves);
      setEmployees(updatedEmployees);
    } catch (err) {
      console.error('Error refreshing leaves after action:', err);
    }
  };

  const periodLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month'
  };

  const pendingLeavesCount = leaveRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#02140e] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ========================================================================= */}
        {/* TOP EXECUTIVE RIBBON & CONTROLS */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-[#041c14] via-[#07261c] to-[#02140e] border border-[#dfc99a]/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#dfc99a]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#dfc99a]/15 text-[#dfc99a] border border-[#dfc99a]/30">
                  Owner Executive Command Center
                </span>
                <span className="text-[11px] text-[#ede0c4]/50 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-[#dfc99a]" />
                  Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Month-End Financials & Operations Hub
              </h1>
              <p className="text-xs sm:text-sm text-[#ede0c4]/70 mt-1 max-w-3xl">
                One consolidated view answering how much was earned, from where, by what method, and what is owed across courts, shop, bar, memberships, payroll, and taxes.
              </p>
            </div>

            {/* Actions: Period Toggles & Share/Export */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Period selection: today | week | month */}
              <div className="bg-[#02140e] p-1.5 rounded-2xl border border-[#dfc99a]/25 flex items-center shadow-inner">
                {SUPPORTED_PERIODS.map((periodKey) => {
                  const isActive = selectedPeriod === periodKey;
                  return (
                    <button
                      key={periodKey}
                      type="button"
                      onClick={() => setSelectedPeriod(periodKey)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#dfc99a] text-[#02140e] shadow-lg shadow-[#dfc99a]/20 scale-100'
                          : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/10'
                      }`}
                    >
                      {periodLabels[periodKey]}
                    </button>
                  );
                })}
              </div>

              {/* Share Numbers Button */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#dfc99a] to-[#c59e4b] text-[#02140e] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#dfc99a]/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Numbers</span>
              </button>

              {/* Refresh Action */}
              <button
                type="button"
                onClick={() => loadDashboardData(selectedPeriod, true)}
                disabled={loading || refreshing}
                title="Refresh Live Metrics"
                className="p-2.5 rounded-2xl bg-[#02140e] border border-[#dfc99a]/25 text-[#dfc99a] hover:bg-[#dfc99a]/15 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tab Navigation Ribbon */}
          <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-[#dfc99a]/15 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('owner_overview')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'owner_overview'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Owner Financial Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoicing')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'invoicing'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Members & Business Invoicing
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'payroll'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Staff Payroll & Compensation
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('taxes')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'taxes'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              Taxes to Report
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('retail_courts')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'retail_courts'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              Courts & Commercial Retail
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff_leaves')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 relative ${
                activeTab === 'staff_leaves'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Leave Approvals & Shifts
              {pendingLeavesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                  {pendingLeavesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-[#dfc99a]/20 text-[#dfc99a] border border-[#dfc99a]/40 shadow-sm'
                  : 'text-[#ede0c4]/70 hover:text-white hover:bg-[#dfc99a]/5 border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Complete Operations Roster
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadDashboardData(selectedPeriod, true)}
              className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 font-bold tracking-tight"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !ownerSummaryData ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-44 rounded-3xl bg-[#031811] border border-[#dfc99a]/10" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 rounded-3xl bg-[#031811] border border-[#dfc99a]/10" />
              <div className="h-80 rounded-3xl bg-[#031811] border border-[#dfc99a]/10" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* ========================================================================= */}
            {/* TAB 1: OWNER FINANCIAL OVERVIEW (THE 3 CORE QUESTIONS) */}
            {/* ========================================================================= */}
            {(activeTab === 'owner_overview' || activeTab === 'all') && ownerSummaryData && (
              <section aria-label="Owner Financial Hub">
                <OwnerFinancialOverview
                  summary={ownerSummaryData}
                  periodLabel={periodLabels[selectedPeriod]}
                  onOpenInvoiceModal={() => setActiveTab('invoicing')}
                  onOpenPayrollModal={() => setActiveTab('payroll')}
                  onOpenShareModal={() => setIsShareModalOpen(true)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: INVOICING & BUSINESS CLIENTS */}
            {/* ========================================================================= */}
            {(activeTab === 'invoicing' || activeTab === 'all') && (
              <section aria-label="Client Invoicing Section">
                <ClientInvoicingSection onInvoicesUpdated={() => loadDashboardData(selectedPeriod, true)} />
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: STAFF PAYROLL & COMPENSATION */}
            {/* ========================================================================= */}
            {(activeTab === 'payroll' || activeTab === 'all') && (
              <section aria-label="Staff Payroll Section">
                <StaffPayrollSection onPayrollUpdated={() => loadDashboardData(selectedPeriod, true)} />
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: TAXES TO REPORT */}
            {/* ========================================================================= */}
            {(activeTab === 'taxes' || activeTab === 'all') && (
              <section aria-label="Tax Reporting Section">
                <TaxReportingSection period={selectedPeriod} periodLabel={periodLabels[selectedPeriod]} />
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: RETAIL & COURTS DEEP DIVE */}
            {/* ========================================================================= */}
            {(activeTab === 'retail_courts' || activeTab === 'all') && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Shop & Bar Commercial Summary */}
                {salesData && (
                  <section aria-label="Retail and Bar Performance">
                    <ShopBarSummarySection salesData={salesData} periodLabel={periodLabels[selectedPeriod]} />
                  </section>
                )}

                {/* Court Usage & Membership Summary 2-Col Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {courtData && (
                    <section aria-label="Court Utilization">
                      <CourtUsageSection courtData={courtData} periodLabel={periodLabels[selectedPeriod]} />
                    </section>
                  )}
                  {membershipData && (
                    <section aria-label="Membership Metrics">
                      <MembershipSummarySection membershipData={membershipData} periodLabel={periodLabels[selectedPeriod]} />
                    </section>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: STAFF & LEAVE APPROVALS */}
            {/* ========================================================================= */}
            {(activeTab === 'staff_leaves' || activeTab === 'all') && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Pending Leave Approvals with Confirmation Workflow */}
                <section aria-label="Leave Approvals">
                  <LeaveApprovals 
                    leaveRequests={leaveRequests} 
                    onLeaveUpdated={handleLeaveUpdated} 
                  />
                </section>

                {/* Shift Overview for Active Date */}
                <section aria-label="Shifts Overview">
                  <ShiftOverview shifts={shifts} />
                </section>

                {/* Full Employee Roster Table */}
                <section aria-label="Employee Roster">
                  <EmployeeTable employees={employees} />
                </section>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* SHARE NUMBERS & EXECUTIVE BRIEFING MODAL */}
        {/* ========================================================================= */}
        <ExecutiveBriefingModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          summary={ownerSummaryData}
          periodLabel={periodLabels[selectedPeriod]}
        />

      </div>
    </div>
  );
}

