import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validatePeriod,
  validateLeaveAction,
  formatCurrency,
  computePercentage,
  SUPPORTED_PERIODS
} from '../managementValidation.js';

import {
  getDashboardSummary,
  getRevenueReport,
  getCourtUsageReport,
  getMembershipsReport,
  getSalesReport,
  getEmployees,
  getShifts,
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  resetManagementStore
} from '../managementApi.js';

describe('Management Dashboard & Staff Operations Tests (MEMBER 2)', () => {
  beforeEach(() => {
    resetManagementStore();
  });

  // Test 1: Period Validation
  test('validatePeriod accepts supported periods and rejects unsupported values', () => {
    assert.equal(validatePeriod('today').isValid, true);
    assert.equal(validatePeriod('week').isValid, true);
    assert.equal(validatePeriod('month').isValid, true);
    assert.equal(validatePeriod('TODAY').isValid, true);

    const invalidYear = validatePeriod('year');
    assert.equal(invalidYear.isValid, false);
    assert.ok(invalidYear.error.includes('Supported values'));

    const invalidEmpty = validatePeriod('');
    assert.equal(invalidEmpty.isValid, false);
  });

  // Test 2: Dashboard Summary across all periods ('today', 'week', 'month')
  test('getDashboardSummary returns valid KPI metrics for today, week, and month', async () => {
    // 1. Today
    const todaySummary = await getDashboardSummary('today');
    assert.equal(todaySummary.period, 'today');
    assert.ok(todaySummary.kpis.totalRevenue > 0);
    assert.ok(todaySummary.kpis.courtBookingsCount > 0);
    assert.ok(todaySummary.kpis.courtUtilizationPct >= 0 && todaySummary.kpis.courtUtilizationPct <= 100);
    assert.ok(Array.isArray(todaySummary.revenueBySource));
    assert.ok(todaySummary.revenueBySource.length >= 4);

    // 2. Week
    const weekSummary = await getDashboardSummary('week');
    assert.equal(weekSummary.period, 'week');
    assert.ok(weekSummary.kpis.totalRevenue > todaySummary.kpis.totalRevenue);
    assert.ok(weekSummary.kpis.courtBookingsCount > todaySummary.kpis.courtBookingsCount);

    // 3. Month
    const monthSummary = await getDashboardSummary('month');
    assert.equal(monthSummary.period, 'month');
    assert.ok(monthSummary.kpis.totalRevenue > weekSummary.kpis.totalRevenue);
    assert.ok(monthSummary.kpis.courtBookingsCount > weekSummary.kpis.courtBookingsCount);
  });

  // Test 3: Revenue by Source & Payment Methods
  test('getRevenueReport returns breakdown by source and payment channels', async () => {
    const report = await getRevenueReport('today');
    assert.equal(report.period, 'today');
    assert.ok(report.totalRevenue > 0);
    assert.ok(Array.isArray(report.revenueBySource));

    const sourceNames = report.revenueBySource.map((s) => s.source.toLowerCase());
    assert.ok(sourceNames.some((s) => s.includes('court')));
    assert.ok(sourceNames.some((s) => s.includes('membership')));
    assert.ok(sourceNames.some((s) => s.includes('bar')));
    assert.ok(sourceNames.some((s) => s.includes('shop')));
  });

  // Test 4: Court Usage Report with per-court breakdown
  test('getCourtUsageReport provides utilization percentages and hours booked', async () => {
    const report = await getCourtUsageReport('week');
    assert.equal(report.period, 'week');
    assert.ok(report.overallUtilizationPct > 50);
    assert.ok(report.totalHoursBooked > 0);
    assert.ok(Array.isArray(report.courtBreakdown));
    assert.ok(report.courtBreakdown.length >= 4);

    const centreCourt = report.courtBreakdown.find((c) => c.courtId === 'court-1');
    assert.ok(centreCourt);
    assert.equal(centreCourt.type, 'Tennis');
    assert.ok(centreCourt.hoursBooked > 0);
  });

  // Test 5: Memberships Report
  test('getMembershipsReport provides tier distribution and active counts', async () => {
    const report = await getMembershipsReport('month');
    assert.equal(report.period, 'month');
    assert.ok(report.totalActiveMembers > 100);
    assert.ok(report.newSignups > 0);
    assert.ok(Array.isArray(report.tierDistribution));
    assert.equal(report.tierDistribution.length, 3);
  });

  // Test 6: Sales Report for Shop and Bar
  test('getSalesReport includes bar orders, shop orders, and top products', async () => {
    const report = await getSalesReport('today');
    assert.equal(report.period, 'today');
    assert.ok(report.barSummary.totalOrders > 0);
    assert.ok(report.shopSummary.totalOrders > 0);
    assert.ok(Array.isArray(report.barSummary.topItems));
    assert.ok(Array.isArray(report.shopSummary.topItems));
  });

  // Test 7: Employee Directory
  test('getEmployees returns staff roster matching database schema', async () => {
    const employees = await getEmployees();
    assert.ok(Array.isArray(employees));
    assert.ok(employees.length >= 4);

    const manager = employees.find((e) => e.id === 'STF-001');
    assert.ok(manager);
    assert.equal(manager.name, 'Kenil Patel');
    assert.equal(manager.department, 'management');
    assert.equal(manager.status, 'active');
  });

  // Test 8: Shift Schedules
  test('getShifts retrieves duty shifts for the active date', async () => {
    const shifts = await getShifts();
    assert.ok(Array.isArray(shifts));
    assert.ok(shifts.length >= 3);

    const shift = shifts[0];
    assert.ok(shift.id);
    assert.ok(shift.employeeName);
    assert.ok(shift.startTime);
    assert.ok(shift.endTime);
  });

  // Test 9: Leave Approval Workflow (requires confirmation)
  test('approveLeaveRequest requires confirmation and transitions pending request to approved', async () => {
    // 1. Without confirmation: must be rejected by validation
    await assert.rejects(
      async () => {
        await approveLeaveRequest('LR-101', false);
      },
      (err) => {
        return err.message.includes('confirmation is required');
      }
    );

    // 2. With confirmation: approves and updates status
    const approved = await approveLeaveRequest('LR-101', true);
    assert.equal(approved.id, 'LR-101');
    assert.equal(approved.status, 'approved');
    assert.ok(approved.approvedBy);

    // Verify list reflects approved status
    const requests = await getLeaveRequests('approved');
    assert.ok(requests.some((r) => r.id === 'LR-101'));
  });

  // Test 10: Leave Rejection Workflow (requires confirmation)
  test('rejectLeaveRequest requires confirmation and transitions pending request to rejected', async () => {
    // 1. Without confirmation: must be rejected
    await assert.rejects(
      async () => {
        await rejectLeaveRequest('LR-102', false);
      },
      (err) => {
        return err.message.includes('confirmation is required');
      }
    );

    // 2. With confirmation: rejects and updates status
    const rejected = await rejectLeaveRequest('LR-102', true);
    assert.equal(rejected.id, 'LR-102');
    assert.equal(rejected.status, 'rejected');

    // Verify list reflects rejected status
    const requests = await getLeaveRequests('rejected');
    assert.ok(requests.some((r) => r.id === 'LR-102'));
  });

  // Test 11: Edge case - Reject invalid period
  test('getDashboardSummary rejects invalid periods with error', async () => {
    await assert.rejects(
      async () => {
        await getDashboardSummary('quarterly');
      },
      (err) => {
        return err.message.includes('Invalid period');
      }
    );
  });

  // Test 12: Utility helpers
  test('utility helpers formatCurrency and computePercentage work correctly', () => {
    assert.ok(formatCurrency(5000).includes('5,000'));
    assert.equal(computePercentage(50, 200), 25);
    assert.equal(computePercentage(0, 0), 0);
  });

  // Test 13: Leave approval updates associated employee status to 'on_leave'
  test('approving leave request updates employee status to on_leave in roster', async () => {
    // STF-002 (Priya Nair) requests leave LR-102
    const beforeEmps = await getEmployees();
    const priyaBefore = beforeEmps.find((e) => e.id === 'STF-002');
    assert.equal(priyaBefore.status, 'active');

    await approveLeaveRequest('LR-102', true);

    const afterEmps = await getEmployees();
    const priyaAfter = afterEmps.find((e) => e.id === 'STF-002');
    assert.equal(priyaAfter.status, 'on_leave');
  });

  // Test 14: Handling non-existent leave requests
  test('approving non-existent leave request throws error', async () => {
    await assert.rejects(
      async () => {
        await approveLeaveRequest('LR-99999', true);
      },
      (err) => {
        return err.message.includes('not found');
      }
    );
  });

  // Test 15: Edge Case - Filter leave requests by pending vs approved vs rejected
  test('getLeaveRequests filters correctly by status', async () => {
    const pending = await getLeaveRequests('pending');
    assert.ok(pending.every((r) => r.status === 'pending'));

    const approved = await getLeaveRequests('approved');
    assert.ok(approved.every((r) => r.status === 'approved'));

    const all = await getLeaveRequests('all');
    assert.ok(all.length >= pending.length + approved.length);
  });
});
