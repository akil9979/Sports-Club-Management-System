import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  CLUB_START_TIMES,
  calculateOneHourEndTime,
  isThirtyMinuteInterval,
  isExactlyOneHour,
  validateBookingInput,
  buildThirtyMinuteSlotGrid
} from '../bookingValidation.js';

import {
  getSports,
  getCourts,
  getCourtAvailability,
  getBookings,
  createBooking,
  cancelBooking,
  getMemberBookingUsage,
  resetStoredBookings,
  getStoredBookings
} from '../bookingApi.js';

describe('Member Court Booking Experience Tests (MEMBER 1)', () => {
  beforeEach(() => {
    resetStoredBookings();
  });

  // Test 1: 30-Minute Interval Start Times & 1-Hour Durations
  test('validates 30-minute start intervals and exact 1-hour durations', () => {
    // Valid 30-minute start intervals
    assert.equal(isThirtyMinuteInterval('06:00'), true);
    assert.equal(isThirtyMinuteInterval('06:30'), true);
    assert.equal(isThirtyMinuteInterval('07:00'), true);
    assert.equal(isThirtyMinuteInterval('18:30'), true);
    assert.equal(isThirtyMinuteInterval('2026-10-04T08:30:00.000Z'), true);

    // Invalid non-30 minute start intervals
    assert.equal(isThirtyMinuteInterval('06:15'), false);
    assert.equal(isThirtyMinuteInterval('07:45'), false);
    assert.equal(isThirtyMinuteInterval('14:10'), false);

    // One-hour duration computation
    assert.equal(calculateOneHourEndTime('06:00'), '07:00');
    assert.equal(calculateOneHourEndTime('06:30'), '07:30');
    assert.equal(calculateOneHourEndTime('19:30'), '20:30');

    // Exactly 1-hour duration check
    assert.equal(isExactlyOneHour('06:00', '07:00'), true);
    assert.equal(isExactlyOneHour('06:30', '07:30'), true);
    assert.equal(isExactlyOneHour('06:00', '06:30'), false);
    assert.equal(isExactlyOneHour('06:00', '08:00'), false);
  });

  // Test 2: Validation of required client inputs
  test('validateBookingInput rejects missing court, date, or start time', () => {
    const invalidInput = {
      courtId: '',
      date: '',
      startTime: '',
      endTime: ''
    };

    const res = validateBookingInput(invalidInput);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.courtId, 'Court ID error expected');
    assert.ok(res.errors.bookingDate, 'Booking date error expected');
    assert.ok(res.errors.startTime, 'Start time error expected');
    assert.ok(res.errors.endTime, 'End time error expected');
  });

  // Test 3: Normal Booking
  test('normal booking completes successfully with 1-hour duration and confirmed status', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const bookingPayload = {
      courtId: 'court-1',
      bookingDate: dateStr,
      startTime: `${dateStr}T09:00:00.000Z`,
      endTime: `${dateStr}T10:00:00.000Z`,
      memberId: 'MEM-8801',
      guestName: 'Devon Conway',
      guestEmail: 'devon@example.com',
      notes: 'Practice singles rally'
    };

    const booking = await createBooking(bookingPayload);
    assert.ok(booking.id);
    assert.ok(booking.bookingNumber);
    assert.equal(booking.courtId, 'court-1');
    assert.equal(booking.memberId, 'MEM-8801');
    assert.equal(booking.status, 'confirmed');
    assert.equal(booking.rateApplied, 0); // Gold tier is waived
    assert.equal(booking.paymentStatus, 'waived');
  });

  // Test 4: Overlapping Booking Attempt
  test('overlapping booking attempt on same court is rejected with COURT_SLOT_UNAVAILABLE', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Pre-seeded: court-1 has confirmed booking at 07:00 - 08:00
    // Attempt overlapping slot starting at 07:30 (07:30 - 08:30)
    const overlappingPayload = {
      courtId: 'court-1',
      bookingDate: today,
      startTime: `${today}T07:30:00.000Z`,
      endTime: `${today}T08:30:00.000Z`,
      memberId: 'MEM-4920',
      guestName: 'Sarah Jenkins',
      guestEmail: 'sarah.j@example.com'
    };

    await assert.rejects(
      async () => {
        await createBooking(overlappingPayload);
      },
      (err) => {
        return (
          err.code === 'COURT_SLOT_UNAVAILABLE' ||
          err.message.includes('conflicts') ||
          err.statusCode === 409
        );
      }
    );
  });

  // Test 5: Third Booking Attempt (Daily Limit Exceeded: 2 plays/day)
  test('rejects third booking attempt for same member on same day (daily limit exceeded)', async () => {
    const testDate = '2026-10-10';

    // Member Devon Conway books 1st session (08:00 - 09:00)
    await createBooking({
      courtId: 'court-1',
      bookingDate: testDate,
      startTime: `${testDate}T08:00:00.000Z`,
      endTime: `${testDate}T09:00:00.000Z`,
      memberId: 'MEM-8801',
      guestName: 'Devon Conway'
    });

    // Check usage is 1/2
    let usage = await getMemberBookingUsage('MEM-8801', testDate);
    assert.equal(usage.usedCount, 1);
    assert.equal(usage.display, '1/2');
    assert.equal(usage.canBook, true);

    // Member Devon Conway books 2nd session (11:00 - 12:00)
    await createBooking({
      courtId: 'court-2',
      bookingDate: testDate,
      startTime: `${testDate}T11:00:00.000Z`,
      endTime: `${testDate}T12:00:00.000Z`,
      memberId: 'MEM-8801',
      guestName: 'Devon Conway'
    });

    // Check usage is 2/2
    usage = await getMemberBookingUsage('MEM-8801', testDate);
    assert.equal(usage.usedCount, 2);
    assert.equal(usage.display, '2/2');
    assert.equal(usage.canBook, false);

    // Attempt 3rd booking on the same day -> Must be rejected!
    await assert.rejects(
      async () => {
        await createBooking({
          courtId: 'court-3',
          bookingDate: testDate,
          startTime: `${testDate}T16:00:00.000Z`,
          endTime: `${testDate}T17:00:00.000Z`,
          memberId: 'MEM-8801',
          guestName: 'Devon Conway'
        });
      },
      (err) => {
        return (
          err.code === 'DAILY_LIMIT_EXCEEDED' ||
          err.message.includes('Daily limit exceeded')
        );
      }
    );
  });

  // Test 6: Expired Member
  test('rejects booking attempt from member with expired membership', async () => {
    const today = new Date().toISOString().split('T')[0];

    // MEM-1092 is pre-seeded with expired membership
    const expiredMemberPayload = {
      courtId: 'court-2',
      bookingDate: today,
      startTime: `${today}T15:00:00.000Z`,
      endTime: `${today}T16:00:00.000Z`,
      memberId: 'MEM-1092',
      guestName: 'Marcus Finch'
    };

    await assert.rejects(
      async () => {
        await createBooking(expiredMemberPayload);
      },
      (err) => {
        return (
          err.code === 'EXPIRED_MEMBERSHIP' ||
          err.message.includes('expired')
        );
      }
    );
  });

  // Test 7: Cancellation Action & Slot Freeing
  test('cancelling a booking frees up the court slot and restores member daily quota', async () => {
    const testDate = '2026-10-15';

    // 1. Create a booking
    const booking = await createBooking({
      courtId: 'court-4',
      bookingDate: testDate,
      startTime: `${testDate}T10:00:00.000Z`,
      endTime: `${testDate}T11:00:00.000Z`,
      memberId: 'MEM-4920',
      guestName: 'Sarah Jenkins'
    });

    let usage = await getMemberBookingUsage('MEM-4920', testDate);
    assert.equal(usage.usedCount, 1);
    assert.equal(usage.display, '1/2');

    // 2. Cancel the booking
    const cancelled = await cancelBooking(booking.id, 'Rescheduling match');
    assert.equal(cancelled.id, booking.id);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.cancellationReason, 'Rescheduling match');

    // 3. Daily usage drops back to 0/2
    usage = await getMemberBookingUsage('MEM-4920', testDate);
    assert.equal(usage.usedCount, 0);
    assert.equal(usage.display, '0/2');
    assert.equal(usage.canBook, true);

    // 4. The same slot can now be re-booked without conflict
    const rebooked = await createBooking({
      courtId: 'court-4',
      bookingDate: testDate,
      startTime: `${testDate}T10:00:00.000Z`,
      endTime: `${testDate}T11:00:00.000Z`,
      memberId: 'MEM-8801',
      guestName: 'Devon Conway'
    });

    assert.ok(rebooked.id);
    assert.equal(rebooked.status, 'confirmed');
  });

  // Test 8: Availability Calculation Matrix with Social Mixer & 30-min Intervals
  test('getCourtAvailability returns 30-min slot matrix identifying Social Mixers and booked slots', async () => {
    const today = new Date().toISOString().split('T')[0];
    const availability = await getCourtAvailability('court-1', today);

    assert.equal(availability.courtId, 'court-1');
    assert.ok(Array.isArray(availability.slots));
    assert.ok(availability.slots.length > 0);

    // Check that 07:00 slot is marked unavailable / booked
    const slot0700 = availability.slots.find((s) => s.startTime === '07:00');
    assert.ok(slot0700, '07:00 slot exists');
    assert.equal(slot0700.available, false);

    // Check that overlapping 07:30 slot is marked unavailable due to overlap
    const slot0730 = availability.slots.find((s) => s.startTime === '07:30');
    assert.ok(slot0730, '07:30 slot exists');
    assert.equal(slot0730.available, false);

    // Check that 19:00 slot is marked Social Play (Open Mixer)
    const slot1900 = availability.slots.find((s) => s.startTime === '19:00');
    assert.ok(slot1900, '19:00 slot exists');
    assert.equal(slot1900.available, false);
    assert.ok(slot1900.status.includes('Social Play'));
  });

  // Test 9: Rejects Non-30 Minute Start Time
  test('rejects booking with invalid start times (e.g. 10:15 or 14:45)', async () => {
    const today = new Date().toISOString().split('T')[0];

    await assert.rejects(
      async () => {
        await createBooking({
          courtId: 'court-1',
          bookingDate: today,
          startTime: `${today}T10:15:00.000Z`,
          endTime: `${today}T11:15:00.000Z`,
          memberId: 'MEM-8801'
        });
      },
      (err) => {
        return err.message.includes('30-minute interval');
      }
    );
  });
});
