import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateMemberRegistration,
  validateMemberProfile,
  calculateAge
} from '../memberValidation.js';

import {
  getMembershipPlans,
  getMembers,
  getMemberById,
  registerMember,
  updateMember,
  assignMembership,
  getMemberMemberships
} from '../membershipApi.js';

describe('Membership System Tests (Member 1)', () => {
  // Test 1: Age calculation & Junior eligibility validation
  test('calculateAge correctly computes ages for past dates', () => {
    // Exact 15 years old
    const fifteenYearsAgo = new Date();
    fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
    const dob15 = fifteenYearsAgo.toISOString().split('T')[0];
    assert.equal(calculateAge(dob15), 15);

    // Exact 25 years old
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
    const dob25 = twentyFiveYearsAgo.toISOString().split('T')[0];
    assert.equal(calculateAge(dob25), 25);
  });

  // Test 2: Validation of required fields
  test('validateMemberRegistration enforces required name, email, phone, dob, and plan', () => {
    const invalidForm = {
      name: '',
      email: 'not-an-email',
      phone: '123',
      dob: '',
      planId: ''
    };

    const res = validateMemberRegistration(invalidForm);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.name, 'Expected name error');
    assert.ok(res.errors.email, 'Expected email error');
    assert.ok(res.errors.phone, 'Expected phone error');
    assert.ok(res.errors.dob, 'Expected dob error');
    assert.ok(res.errors.planId, 'Expected planId error');
  });

  // Test 3: Validation prevents Junior membership for adults (age >= 18)
  test('validateMemberRegistration rejects Junior membership for age >= 18', () => {
    const adultDob = '1995-04-12'; // ~31 years old
    const formWithJunior = {
      name: 'Ramesh Gupta',
      email: 'ramesh.gupta@example.com',
      phone: '+919876543210',
      dob: adultDob,
      planId: 'junior',
      startDate: new Date().toISOString().split('T')[0]
    };

    const res = validateMemberRegistration(formWithJunior);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.planId.includes('strictly reserved for players under 18'));
  });

  // Test 4: Validation accepts Junior membership for youth (age < 18)
  test('validateMemberRegistration permits Junior membership for youth (< 18)', () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 12);
    const youthDob = tenYearsAgo.toISOString().split('T')[0];

    const validJuniorForm = {
      name: 'Aarav Patel',
      email: 'aarav.patel@example.com',
      phone: '+919876543210',
      dob: youthDob,
      planId: 'junior',
      startDate: new Date().toISOString().split('T')[0]
    };

    const res = validateMemberRegistration(validJuniorForm);
    assert.equal(res.isValid, true);
    assert.equal(Object.keys(res.errors).length, 0);
  });

  // Test 5: Backend membership plans retrieval adheres to contract
  test('getMembershipPlans returns official Gold, Silver, and Junior tiers', async () => {
    const plans = await getMembershipPlans();
    assert.ok(Array.isArray(plans));
    assert.ok(plans.length >= 3, 'Must have at least Gold, Silver, Junior plans');

    const tiers = plans.map(p => p.tier.toLowerCase());
    assert.ok(tiers.includes('gold'), 'Must contain Gold tier');
    assert.ok(tiers.includes('silver'), 'Must contain Silver tier');
    assert.ok(tiers.includes('junior'), 'Must contain Junior tier');

    // Verify plans contain privileges and pricing directly from backend
    const gold = plans.find(p => p.tier.toLowerCase() === 'gold');
    assert.ok(gold.price > 0);
    assert.ok(gold.courtPrivileges);
    assert.ok(gold.shopDiscount);
    assert.ok(gold.barDiscount);
  });

  // Test 6: Member registration creates member and sets active membership
  test('registerMember registers new member and records active membership', async () => {
    const uniqueEmail = `test.member_${Date.now()}@sportclub.test`;
    const newMemberPayload = {
      name: 'Test Member Gold',
      email: uniqueEmail,
      phone: '+919988776655',
      dob: '1992-06-15',
      gender: 'Male',
      address: 'Test Street 101',
      emergencyContact: '+919988776600',
      planId: 'gold',
      billingCycle: 'monthly',
      paymentMethod: 'upi'
    };

    const result = await registerMember(newMemberPayload);
    const member = result.member || result;
    assert.ok(member.id);
    assert.equal(member.name, 'Test Member Gold');
    assert.equal(member.email, uniqueEmail);
    assert.ok(member.activeMembership, 'Should have an active membership');
    assert.equal(member.activeMembership.tier, 'Gold');
    assert.equal(member.activeMembership.status, 'active');

    // Retrieve via getMemberById
    const fetched = await getMemberById(member.id);
    assert.equal(fetched.id, member.id);
    assert.equal(fetched.name, 'Test Member Gold');
  });

  // Test 7: Duplicate email rejection
  test('registerMember rejects duplicate emails with 409 error', async () => {
    // Devon Conway's email is pre-seeded
    const duplicatePayload = {
      name: 'Devon Conway Imposter',
      email: 'devon@example.com',
      phone: '+919900000000',
      dob: '1990-01-01',
      planId: 'gold'
    };

    await assert.rejects(
      async () => {
        await registerMember(duplicatePayload);
      },
      (err) => {
        return err.message.includes('already registered');
      }
    );
  });

  // Test 8: Member profile editing (PATCH)
  test('updateMember updates member contact details and address', async () => {
    // Update pre-seeded Devon Conway
    const updated = await updateMember('MEM-8801', {
      phone: '+919999888877',
      address: 'Suite 404, Champions Villa, Ahmedabad',
      emergencyContact: '+919876599999'
    });

    assert.equal(updated.id, 'MEM-8801');
    assert.equal(updated.phone, '+919999888877');
    assert.equal(updated.address, 'Suite 404, Champions Villa, Ahmedabad');
    assert.equal(updated.emergencyContact, '+919876599999');
  });

  // Test 9: Assign / Renew membership (POST /api/members/:id/memberships)
  test('assignMembership renews or changes membership tier and updates history', async () => {
    // Pre-seeded Marcus Finch has expired membership (MEM-1092)
    const renewal = await assignMembership('MEM-1092', {
      planId: 'gold',
      billingCycle: 'annual',
      startDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'card',
      referenceNumber: 'TXN-RENEW-1092'
    });

    assert.ok(renewal.membership);
    assert.equal(renewal.membership.memberId, 'MEM-1092');
    assert.equal(renewal.membership.tier, 'Gold');
    assert.equal(renewal.membership.status, 'active');
    assert.equal(renewal.membership.billingCycle, 'annual');

    // Verify history contains the new record
    const histories = await getMemberMemberships('MEM-1092');
    assert.ok(Array.isArray(histories));
    assert.ok(histories.length >= 2, 'History should now contain past expired and new active plan');
    assert.equal(histories[0].status, 'active');
  });

  // Test 10: Junior membership rejected by backend adapter if member is >= 18
  test('assignMembership rejects Junior plan if member age >= 18', async () => {
    // Devon Conway (MEM-8801) is born in 1991 (~35 yrs old)
    await assert.rejects(
      async () => {
        await assignMembership('MEM-8801', {
          planId: 'junior',
          billingCycle: 'monthly',
          startDate: new Date().toISOString().split('T')[0]
        });
      },
      (err) => {
        return err.message.includes('under 18 years of age');
      }
    );
  });

  // Test 11: Expired membership state inspection
  test('member with expired membership is accurately flagged with expired status', async () => {
    const member = await getMemberById('MEM-1092');
    assert.ok(member);
    // Before or after renewal, history maintains expired records
    const history = await getMemberMemberships('MEM-1092');
    const expiredRecord = history.find(h => h.status === 'expired');
    assert.ok(expiredRecord, 'Should find an expired subscription in history');
    assert.ok(new Date(expiredRecord.endDate) < new Date(), 'Expired endDate must be in the past');
  });

  // Test 12: No active membership (Walk-in rate) handling
  test('member without active plan has null activeMembership', async () => {
    const member = await getMemberById('MEM-9055');
    assert.ok(member);
    assert.equal(member.name, 'Pooja Reddy');
    assert.equal(member.activeMembership, null, 'Walk-in member should have null active membership');
  });

  // Test 13: API error state for non-existent member
  test('getMemberById rejects with not found error for non-existent member ID', async () => {
    await assert.rejects(
      async () => {
        await getMemberById('MEM-DOES-NOT-EXIST-9999');
      },
      (err) => {
        return err.message.includes('Member not found');
      }
    );
  });

  // Test 14: API error state for invalid plan ID assignment
  test('assignMembership rejects when assigned an invalid or unknown plan', async () => {
    await assert.rejects(
      async () => {
        await assignMembership('MEM-8801', {
          planId: 'platinum-diamond-ultra-unknown',
          billingCycle: 'monthly'
        });
      },
      (err) => {
        return err.message.includes('Invalid plan specified');
      }
    );
  });

  // Test 15: Member profile update validation checks
  test('validateMemberProfile rejects empty names and invalid emails', () => {
    const invalidProfile = {
      name: ' ',
      email: 'notanemail',
      phone: '123'
    };
    const res = validateMemberProfile(invalidProfile);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.name);
    assert.ok(res.errors.email);
    assert.ok(res.errors.phone);

    const validProfile = {
      name: 'Rohan Mehra',
      email: 'rohan.mehra@example.com',
      phone: '+919876543210'
    };
    const validRes = validateMemberProfile(validProfile);
    assert.equal(validRes.isValid, true);
    assert.equal(Object.keys(validRes.errors).length, 0);
  });
});
