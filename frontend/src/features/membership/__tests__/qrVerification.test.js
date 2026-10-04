import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateMemberQrPayload,
  verifyMemberQrCode,
  logFrontdeskCheckIn,
  getFrontdeskCheckIns,
  TIER_CONFIG
} from '../qrVerificationService.js';

describe('QR Verification & Pass Engine Tests', () => {
  const mockGoldMember = {
    id: 'MEM-8801',
    memberNumber: 'CC-2026-8801',
    name: 'Devon Conway',
    email: 'devon@example.com',
    phone: '+919876543210',
    dob: '1991-07-08',
    gender: 'Male',
    emergencyContact: '+919876500001',
    activeMembership: {
      id: 'MSHIP-701',
      tier: 'Gold',
      planName: 'Gold Championship',
      startDate: '2026-09-15',
      endDate: '2026-10-15',
      status: 'active',
      courtPrivileges: '100% complimentary standard court hours',
      shopDiscount: '20% Pro Shop discount',
      barDiscount: '15% Lounge & Bar discount',
      advanceBookingDays: 14,
      guestPassesPerMonth: 2
    }
  };

  const mockJuniorMember = {
    id: 'MEM-3104',
    memberNumber: 'CC-2026-3104',
    name: 'Aryan Sharma',
    email: 'aryan.sharma@juniorclub.org',
    phone: '+919876543212',
    dob: '2011-05-18', // ~15 years old
    gender: 'Male',
    emergencyContact: '+919876500003 (Father)',
    activeMembership: {
      id: 'MSHIP-703',
      tier: 'Junior',
      planName: 'Junior Rising Star',
      startDate: '2026-09-10',
      endDate: '2026-10-10',
      status: 'active',
      courtPrivileges: 'Free off-peak court access (3 PM - 6 PM weekdays)',
      shopDiscount: '10% Pro Shop discount',
      barDiscount: '10% Health drinks & snacks discount',
      advanceBookingDays: 7,
      guestPassesPerMonth: 0
    }
  };

  const mockExpiredMember = {
    id: 'MEM-1092',
    memberNumber: 'CC-2026-1092',
    name: 'Marcus Finch',
    email: 'marcus.finch@globalnet.com',
    phone: '+919876543213',
    dob: '1988-11-30',
    gender: 'Male',
    emergencyContact: '+919876500004',
    activeMembership: {
      id: 'MSHIP-650',
      tier: 'Gold',
      planName: 'Gold Championship',
      startDate: '2026-08-01',
      endDate: '2026-09-01', // Expired
      status: 'expired',
      courtPrivileges: '100% complimentary standard court hours'
    }
  };

  // Test 1: Payload generation structure
  test('generateMemberQrPayload generates standardized credentials payload', () => {
    const payload = generateMemberQrPayload(mockGoldMember);
    assert.ok(payload);
    assert.equal(payload.type, 'CHAMPIONS_CLUB_MEMBERSHIP_PASS');
    assert.equal(payload.member.name, 'Devon Conway');
    assert.equal(payload.member.phone, '+919876543210');
    assert.equal(payload.membership.tier, 'Gold');
    assert.equal(payload.membership.startDate, '2026-09-15');
    assert.equal(payload.membership.endDate, '2026-10-15');
    assert.ok(payload.security.signature.startsWith('CC-VERIFY-'));
  });

  // Test 2: Junior member eligibility calculation in payload
  test('generateMemberQrPayload computes age and verifies junior eligibility', () => {
    const payload = generateMemberQrPayload(mockJuniorMember);
    assert.ok(payload);
    assert.equal(payload.membership.tier, 'Junior');
    assert.ok(payload.member.age < 18, 'Expected Junior member age to be under 18');
  });

  // Test 3: Tier styling configurations exist
  test('TIER_CONFIG covers Gold, Silver, and Junior tiers', () => {
    assert.ok(TIER_CONFIG.Gold);
    assert.ok(TIER_CONFIG.Silver);
    assert.ok(TIER_CONFIG.Junior);
    assert.equal(TIER_CONFIG.Gold.colorHex, '#dfc99a');
    assert.equal(TIER_CONFIG.Silver.colorHex, '#94a3b8');
    assert.equal(TIER_CONFIG.Junior.colorHex, '#10b981');
  });

  // Test 4: Verification of active Gold member
  test('verifyMemberQrCode approves active Gold membership', async () => {
    const rawPayload = JSON.stringify(generateMemberQrPayload(mockGoldMember));
    const result = await verifyMemberQrCode(rawPayload);
    assert.ok(result);
    assert.equal(result.valid, true);
    assert.equal(result.member.name, 'Devon Conway');
    assert.equal(result.membership.tier, 'Gold');
    assert.equal(result.accessGranted, true);
  });

  // Test 5: Verification of expired member
  test('verifyMemberQrCode flags expired member and denies access', async () => {
    const rawPayload = JSON.stringify(generateMemberQrPayload(mockExpiredMember));
    const result = await verifyMemberQrCode(rawPayload);
    assert.ok(result);
    assert.equal(result.status, 'expired');
    assert.equal(result.accessGranted, false);
    const expiredAlert = result.alerts.find(a => a.code === 'MEMBERSHIP_EXPIRED');
    assert.ok(expiredAlert, 'Expected MEMBERSHIP_EXPIRED alert in verification result');
  });

  // Test 6: Check-in recording & history retrieval
  test('logFrontdeskCheckIn and getFrontdeskCheckIns records frontdesk visits', async () => {
    const checkIn = await logFrontdeskCheckIn({
      memberId: 'MEM-8801',
      memberNumber: 'CC-2026-8801',
      memberName: 'Devon Conway',
      tier: 'Gold',
      status: 'active',
      facility: 'Tennis Court 1',
      staffName: 'Aditi Staff',
      accessGranted: true,
      notes: 'Morning singles'
    });

    assert.ok(checkIn.success);
    assert.equal(checkIn.checkIn.facility, 'Tennis Court 1');

    const history = await getFrontdeskCheckIns();
    assert.ok(Array.isArray(history.logs));
    assert.ok(history.stats.totalScans >= 1);
  });
});
