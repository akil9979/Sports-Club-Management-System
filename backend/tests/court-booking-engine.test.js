/**
 * Champions Club - Court Availability & Booking Engine Integration Test Suite
 * Role: MEMBER 3 (Booking Engine Backend)
 */

const http = require('http');
const app = require('../src/app');
const { initSchema } = require('../src/db/init');
const { seedDatabase } = require('../src/db/seed');
const { pool, query } = require('../src/config/database');

let server;
let baseUrl;
let passedCount = 0;
let failedCount = 0;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    failedCount++;
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    passedCount++;
    console.log(`  ✅ PASSED: ${message}`);
  }
}

async function runCourtBookingEngineTests() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - COURT AVAILABILITY & BOOKING ENGINE TEST SUITE');
  console.log('===============================================================\n');

  try {
    // 1. Reset database with canonical schema and seed
    await initSchema();
    await seedDatabase();

    // 2. Start ephemeral test server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`[Test Server] Listening on ${baseUrl}\n`);
        resolve();
      });
    });

    // ------------------------------------------------------------------------
    // TEST 1: SPORTS & COURTS CATALOGUE & AVAILABILITY
    // ------------------------------------------------------------------------
    console.log('[TEST 1] Sports & Courts Catalogue and Availability Grid');
    const sportsRes = await request('/api/sports');
    assert(sportsRes.status === 200, 'GET /api/sports returned HTTP 200');
    assert(Array.isArray(sportsRes.body) && sportsRes.body.length === 5, 'Retrieved all 5 active club sports');

    const courtsRes = await request('/api/courts');
    assert(courtsRes.status === 200, 'GET /api/courts returned HTTP 200');
    assert(Array.isArray(courtsRes.body) && courtsRes.body.length === 5, 'Retrieved all 5 active club courts');

    const tennisCourtsRes = await request('/api/courts?sportId=tennis');
    assert(tennisCourtsRes.status === 200, 'GET /api/courts?sportId=tennis returned HTTP 200');
    assert(tennisCourtsRes.body.length === 2, 'Filtered only tennis courts');

    const availRes = await request('/api/bookings/availability?courtId=court-1&date=2026-12-01');
    assert(availRes.status === 200, 'GET /api/bookings/availability returned HTTP 200');
    assert(availRes.body.slots && availRes.body.slots.length === 15, 'Generated 15 hourly overview slots');
    assert(availRes.body.thirtyMinSlots && availRes.body.thirtyMinSlots.length === 33, 'Generated 33 30-minute interval slots');

    const notFoundCourtRes = await request('/api/bookings/availability?courtId=invalid-court-id&date=2026-12-01');
    assert(notFoundCourtRes.status === 404, 'Non-existent court returned HTTP 404');
    assert(notFoundCourtRes.body.code === 'COURT_NOT_FOUND', 'Error code is COURT_NOT_FOUND');

    // ------------------------------------------------------------------------
    // TEST 2: NORMAL VALID 30-MINUTE/1-HOUR BOOKING
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Normal Booking (1-Hour Duration on 30-Minute Interval)');
    const normalPayload = {
      courtId: 'court-1',
      bookingDate: '2026-12-01',
      startTime: '2026-12-01T10:30:00.000Z',
      endTime: '2026-12-01T11:30:00.000Z',
      memberId: 'MEM-8801', // Gold Member
      notes: 'Weekly singles training match'
    };

    const book1Res = await request('/api/bookings', {
      method: 'POST',
      body: normalPayload
    });

    assert(book1Res.status === 201, 'POST /api/bookings confirmed booking with HTTP 201');
    assert(book1Res.body.data.bookingNumber.startsWith('BK-'), 'Issued formatted booking number BK-YYYY-XXXX');
    assert(book1Res.body.data.rateApplied === 0, 'Gold member received 100% complimentary rate (rateApplied = 0)');
    assert(book1Res.body.data.paymentStatus === 'waived', 'Payment status marked waived for Gold tier');
    assert(book1Res.body.data.participants && book1Res.body.data.participants.length === 1, 'Primary participant auto-created');

    const createdBookingId = book1Res.body.data.id;

    // Verify GET /api/bookings/:id
    const getBookingRes = await request(`/api/bookings/${createdBookingId}`);
    assert(getBookingRes.status === 200, 'GET /api/bookings/:id returned HTTP 200');
    assert(getBookingRes.body.data.courtId === 'court-1', 'Booking belongs to court-1');
    assert(getBookingRes.body.data.participants[0].memberId === 'MEM-8801', 'Participant reflects memberId');

    // ------------------------------------------------------------------------
    // TEST 3: CONFLICT & OVERLAP PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Slot Conflict Detection & Overlap Protection');
    // Overlapping booking on same court (11:00 to 12:00 overlaps with 10:30 to 11:30)
    const overlapPayload = {
      courtId: 'court-1',
      bookingDate: '2026-12-01',
      startTime: '2026-12-01T11:00:00.000Z',
      endTime: '2026-12-01T12:00:00.000Z',
      guestName: 'Overlap Player'
    };

    const overlapRes = await request('/api/bookings', {
      method: 'POST',
      body: overlapPayload
    });

    assert(overlapRes.status === 409, 'Overlapping booking rejected with HTTP 409 Conflict');
    assert(overlapRes.body.code === 'COURT_SLOT_UNAVAILABLE', 'Error code is COURT_SLOT_UNAVAILABLE');

    // Identical slot attempt
    const identicalRes = await request('/api/bookings', {
      method: 'POST',
      body: normalPayload
    });
    assert(identicalRes.status === 409, 'Identical slot booking rejected with HTTP 409');
    assert(identicalRes.body.code === 'COURT_SLOT_UNAVAILABLE', 'Identical slot error code is COURT_SLOT_UNAVAILABLE');

    // ------------------------------------------------------------------------
    // TEST 4: CONCURRENT CONFLICT PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 4] Concurrent Booking Conflict Race Condition');
    const concurrentSlot = {
      courtId: 'court-2',
      bookingDate: '2026-12-05',
      startTime: '2026-12-05T14:30:00.000Z',
      endTime: '2026-12-05T15:30:00.000Z'
    };

    const concurrentAttempts = 5;
    const promises = [];
    for (let i = 0; i < concurrentAttempts; i++) {
      promises.push(
        request('/api/bookings', {
          method: 'POST',
          body: {
            ...concurrentSlot,
            guestName: `Concurrent Player ${i + 1}`,
            guestEmail: `player${i + 1}@example.com`
          }
        })
      );
    }

    const concurrentResults = await Promise.all(promises);
    const successCount = concurrentResults.filter(r => r.status === 201).length;
    const conflictCount = concurrentResults.filter(r => r.status === 409).length;

    assert(successCount === 1, 'Exactly 1 concurrent request succeeded (HTTP 201)');
    assert(conflictCount === concurrentAttempts - 1, `Exactly ${concurrentAttempts - 1} concurrent requests rejected with HTTP 409`);
    assert(
      concurrentResults.filter(r => r.status === 409).every(r => r.body.code === 'COURT_SLOT_UNAVAILABLE'),
      'All rejected concurrent attempts received COURT_SLOT_UNAVAILABLE code'
    );

    // ------------------------------------------------------------------------
    // TEST 5: THIRD MEMBER BOOKING REJECTION (DAILY 2-PLAY LIMIT)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 5] Member Daily Play Limit (Max 2 Plays Per Club Day)');
    // MEM-8801 already has 1 booking on 2026-12-01. Book session #2:
    const book2Res = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-1',
        bookingDate: '2026-12-01',
        startTime: '2026-12-01T16:00:00.000Z',
        endTime: '2026-12-01T17:00:00.000Z',
        memberId: 'MEM-8801'
      }
    });
    assert(book2Res.status === 201, 'Second booking on same club day succeeded (HTTP 201)');

    // Verify member booking usage API
    const usageRes = await request('/api/members/MEM-8801/booking-usage?date=2026-12-01');
    assert(usageRes.status === 200, 'GET /api/members/:id/booking-usage returned HTTP 200');
    assert(usageRes.body.usedCount === 2, 'Usage shows exactly 2 plays used');
    assert(usageRes.body.remaining === 0, 'Usage shows 0 remaining plays');
    assert(usageRes.body.canBook === false, 'canBook flag is false');

    // Attempt 3rd booking on the same club day:
    const book3Res = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-1',
        bookingDate: '2026-12-01',
        startTime: '2026-12-01T18:00:00.000Z',
        endTime: '2026-12-01T19:00:00.000Z',
        memberId: 'MEM-8801'
      }
    });

    assert(book3Res.status === 422, 'Third booking on same club day rejected with HTTP 422');
    assert(book3Res.body.code === 'DAILY_BOOKING_LIMIT_REACHED', 'Error code is DAILY_BOOKING_LIMIT_REACHED');

    // ------------------------------------------------------------------------
    // TEST 6: CONCURRENT DAILY LIMIT RACE CONDITION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 6] Concurrent Daily Limit Race Safety');
    // Fresh member MEM-4920 on date 2026-12-10 has 1 existing booking.
    // Create first booking:
    await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-3',
        bookingDate: '2026-12-10',
        startTime: '2026-12-10T09:00:00.000Z',
        endTime: '2026-12-10T10:00:00.000Z',
        memberId: 'MEM-4920'
      }
    });

    // Send 3 concurrent requests on different courts for the same member on 2026-12-10:
    const limitPromises = [
      request('/api/bookings', {
        method: 'POST',
        body: {
          courtId: 'court-1',
          bookingDate: '2026-12-10',
          startTime: '2026-12-10T11:00:00.000Z',
          endTime: '2026-12-10T12:00:00.000Z',
          memberId: 'MEM-4920'
        }
      }),
      request('/api/bookings', {
        method: 'POST',
        body: {
          courtId: 'court-4',
          bookingDate: '2026-12-10',
          startTime: '2026-12-10T14:00:00.000Z',
          endTime: '2026-12-10T15:00:00.000Z',
          memberId: 'MEM-4920'
        }
      }),
      request('/api/bookings', {
        method: 'POST',
        body: {
          courtId: 'court-5',
          bookingDate: '2026-12-10',
          startTime: '2026-12-10T17:00:00.000Z',
          endTime: '2026-12-10T18:00:00.000Z',
          memberId: 'MEM-4920'
        }
      })
    ];

    const limitResults = await Promise.all(limitPromises);
    const limitWins = limitResults.filter(r => r.status === 201).length;
    const limitRejections = limitResults.filter(r => r.status === 422).length;

    assert(limitWins === 1, 'Exactly 1 concurrent request succeeded up to daily limit (HTTP 201)');
    assert(limitRejections === 2, 'Exactly 2 excess concurrent attempts rejected with HTTP 422');

    // ------------------------------------------------------------------------
    // TEST 7: CANCELLATION & AVAILABILITY RESTORATION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 7] Booking Cancellation & Slot Restoration');
    const cancelRes = await request(`/api/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      body: { reason: 'Member requested schedule change' }
    });

    assert(cancelRes.status === 200, 'PATCH /api/bookings/:id/cancel returned HTTP 200');
    assert(cancelRes.body.data.status === 'cancelled', 'Booking status transitioned to cancelled');

    // Verify member daily usage decreased back to 1
    const postCancelUsage = await request('/api/members/MEM-8801/booking-usage?date=2026-12-01');
    assert(postCancelUsage.body.usedCount === 1, 'Member used count decremented to 1 after cancellation');
    assert(postCancelUsage.body.canBook === true, 'canBook flag is now true');

    // Verify previously booked slot is now available again
    const rebookSlotRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-1',
        bookingDate: '2026-12-01',
        startTime: '2026-12-01T10:30:00.000Z',
        endTime: '2026-12-01T11:30:00.000Z',
        guestName: 'Replacement Player'
      }
    });

    assert(rebookSlotRes.status === 201, 'Successfully re-booked previously cancelled slot (HTTP 201)');

    // Attempting to cancel non-existent booking
    const notFoundCancel = await request('/api/bookings/00000000-0000-0000-0000-000000000000/cancel', {
      method: 'PATCH'
    });
    assert(notFoundCancel.status === 404, 'Cancelling non-existent booking returned HTTP 404');
    assert(notFoundCancel.body.code === 'BOOKING_NOT_FOUND', 'Error code is BOOKING_NOT_FOUND');

    // ------------------------------------------------------------------------
    // TEST 8: SOCIAL PLAY (ONE SHARED SESSION WITH MULTIPLE PARTICIPANTS)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 8] Social Play (Shared Session with Multiple Participants)');
    const socialPayload = {
      courtId: 'court-5', // Padel
      bookingDate: '2026-12-15',
      startTime: '2026-12-15T18:00:00.000Z',
      endTime: '2026-12-15T19:00:00.000Z',
      bookingType: 'social_mixer',
      memberId: 'MEM-1002',
      participants: [
        { memberId: 'MEM-1002', name: 'Rajesh Sharma', isPrimary: true },
        { name: 'Guest Padel Player 2' },
        { name: 'Guest Padel Player 3' },
        { name: 'Guest Padel Player 4' }
      ],
      notes: 'Friday Night Padel Social Mixer'
    };

    const socialRes = await request('/api/bookings', {
      method: 'POST',
      body: socialPayload
    });

    assert(socialRes.status === 201, 'Social booking created with HTTP 201');
    assert(socialRes.body.data.bookingType === 'social_mixer', 'Booking type recorded as social_mixer');
    assert(socialRes.body.data.participants.length === 4, 'All 4 participants linked to single session');

    // Fetch booking details
    const socialDetails = await request(`/api/bookings/${socialRes.body.data.id}`);
    assert(socialDetails.status === 200, 'GET /api/bookings/:id returned social session');
    assert(socialDetails.body.data.participants.length === 4, 'Retrieved all 4 session participants');

    // ------------------------------------------------------------------------
    // TEST 9: EXPIRED MEMBERSHIP REJECTION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 9] Expired Membership Rejection');
    // Pre-seeded MEM-1092 has expired membership
    const expiredBookingRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-1',
        bookingDate: '2026-12-20',
        startTime: '2026-12-20T10:00:00.000Z',
        endTime: '2026-12-20T11:00:00.000Z',
        memberId: 'MEM-1092'
      }
    });

    assert(expiredBookingRes.status === 403, 'Booking attempt with expired membership rejected with HTTP 403');
    assert(expiredBookingRes.body.code === 'MEMBERSHIP_INACTIVE', 'Error code is MEMBERSHIP_INACTIVE');

    // ------------------------------------------------------------------------
    // TEST 10: INVALID TIME & SLOT SANITY VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 10] Invalid Time & Slot Duration Validation');
    // Invalid duration (30 minutes instead of 1 hour)
    const invalidDurationRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-1',
        bookingDate: '2026-12-25',
        startTime: '2026-12-25T14:00:00.000Z',
        endTime: '2026-12-25T14:30:00.000Z',
        guestName: 'Short Player'
      }
    });
    assert(invalidDurationRes.status === 400, '30-minute booking rejected with HTTP 400');
    assert(invalidDurationRes.body.code === 'INVALID_BOOKING_SLOT', 'Error code is INVALID_BOOKING_SLOT');

    // Invalid start time interval (14:15 instead of :00 or :30)
    const invalidIntervalRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-1',
        bookingDate: '2026-12-25',
        startTime: '2026-12-25T14:15:00.000Z',
        endTime: '2026-12-25T15:15:00.000Z',
        guestName: 'Off Interval Player'
      }
    });
    assert(invalidIntervalRes.status === 400, 'Non-30-minute interval start time rejected with HTTP 400');
    assert(invalidIntervalRes.body.code === 'INVALID_BOOKING_SLOT', 'Interval error code is INVALID_BOOKING_SLOT');

    // Non-existent court booking
    const invalidCourtRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        courtId: 'court-999',
        bookingDate: '2026-12-25',
        startTime: '2026-12-25T14:00:00.000Z',
        endTime: '2026-12-25T15:00:00.000Z',
        guestName: 'Player'
      }
    });
    assert(invalidCourtRes.status === 404, 'Booking non-existent court returned HTTP 404');
    assert(invalidCourtRes.body.code === 'COURT_NOT_FOUND', 'Error code is COURT_NOT_FOUND');

    console.log('\n===============================================================');
    console.log(`COURT BOOKING ENGINE SUMMARY: ${passedCount} passed, ${failedCount} failed.`);
    console.log('===============================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n[FATAL TEST ERROR]', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
}

runCourtBookingEngineTests();
