/**
 * Champions Club - Court Availability & Booking Service
 * Role: MEMBER 3 (Booking Engine Backend)
 */

const { query, withTransaction } = require('../../config/database');

// 15 Standard club 1-hour slots
const CLUB_OPERATING_SLOTS = [
  { time: '06:00 - 07:00', startHour: 6, endHour: 7, morning: true },
  { time: '07:00 - 08:00', startHour: 7, endHour: 8, morning: true },
  { time: '08:00 - 09:00', startHour: 8, endHour: 9, morning: true },
  { time: '09:00 - 10:00', startHour: 9, endHour: 10, morning: true },
  { time: '10:00 - 11:00', startHour: 10, endHour: 11, morning: true },
  { time: '11:00 - 12:00', startHour: 11, endHour: 12, morning: true },
  { time: '14:00 - 15:00', startHour: 14, endHour: 15, afternoon: true },
  { time: '15:00 - 16:00', startHour: 15, endHour: 16, afternoon: true },
  { time: '16:00 - 17:00', startHour: 16, endHour: 17, afternoon: true },
  { time: '17:00 - 18:00', startHour: 17, endHour: 18, evening: true, prime: true },
  { time: '18:00 - 19:00', startHour: 18, endHour: 19, evening: true, prime: true },
  { time: '19:00 - 20:00', startHour: 19, endHour: 20, evening: true, prime: true },
  { time: '20:00 - 21:00', startHour: 20, endHour: 21, evening: true, prime: true },
  { time: '21:00 - 22:00', startHour: 21, endHour: 22, evening: true },
  { time: '22:00 - 23:00', startHour: 22, endHour: 23, evening: true }
];

// All 33 valid 30-minute interval start times (1-hour duration each)
const CLUB_THIRTY_MIN_START_TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
];

function calculateOneHourEndTime(startTimeStr) {
  const [hourStr, minStr] = startTimeStr.split(':');
  const h = parseInt(hourStr, 10);
  const endH = h + 1;
  return `${String(endH).padStart(2, '0')}:${minStr}`;
}

class BookingService {
  /**
   * Get all active sports
   */
  async getSports() {
    const res = await query(
      `SELECT id, name, description, icon
       FROM sports
       WHERE is_active = true
       ORDER BY name ASC`
    );
    return res.rows;
  }

  /**
   * Get all active courts, optionally filtered by sport
   */
  async getCourts(sportId = null) {
    let sql = `
      SELECT c.id, c.sport_id, c.name, s.name AS type, c.surface, c.indoor, c.lighting,
             c.hourly_rate, c.member_rate, c.gold_rate, c.max_players, c.description
      FROM courts c
      JOIN sports s ON s.id = c.sport_id
      WHERE c.is_active = true
    `;
    const params = [];

    if (sportId && sportId !== 'all') {
      params.push(sportId.toLowerCase());
      sql += ` AND (LOWER(c.sport_id) = $1 OR LOWER(s.name) = $1)`;
    }

    sql += ` ORDER BY c.name ASC`;

    const res = await query(sql, params);

    return res.rows.map(court => ({
      id: court.id,
      sportId: court.sport_id,
      sport_id: court.sport_id,
      name: court.name,
      type: court.type,
      surface: court.surface,
      indoor: court.indoor,
      lighting: court.lighting,
      hourlyRate: parseFloat(court.hourly_rate),
      memberRate: parseFloat(court.member_rate),
      goldRate: parseFloat(court.gold_rate),
      maxPlayers: court.max_players,
      description: court.description
    }));
  }

  /**
   * Calculate real-time court availability for a specific date against canonical bookings
   */
  async getCourtAvailability(courtId = 'court-1', date = new Date().toISOString().split('T')[0]) {
    // 1. Verify court exists
    const courtRes = await query(
      `SELECT c.id, c.name, c.hourly_rate, c.member_rate, c.gold_rate
       FROM courts c
       WHERE c.id = $1 AND c.is_active = true`,
      [courtId]
    );

    if (courtRes.rowCount === 0) {
      const error = new Error(`Court '${courtId}' not found or inactive`);
      error.statusCode = 404;
      error.code = 'COURT_NOT_FOUND';
      throw error;
    }

    const court = courtRes.rows[0];

    // 2. Fetch active confirmed bookings for this court and date
    const bookingsRes = await query(
      `SELECT id, booking_type, status, start_time, end_time
       FROM bookings
       WHERE court_id = $1 
         AND booking_date = $2
         AND status NOT IN ('cancelled', 'no_show')
       ORDER BY start_time ASC`,
      [courtId, date]
    );

    const existingBookings = bookingsRes.rows;

    // 3. Map 15 overview hourly slots (matches existing contracts and api-integration tests)
    const slots = CLUB_OPERATING_SLOTS.map(slot => {
      const slotStart = new Date(`${date}T${String(slot.startHour).padStart(2, '0')}:00:00.000Z`);
      const slotEnd = new Date(`${date}T${String(slot.endHour).padStart(2, '0')}:00:00.000Z`);

      const conflictingBooking = existingBookings.find(b => {
        const bStart = new Date(b.start_time);
        const bEnd = new Date(b.end_time);
        return bStart < slotEnd && bEnd > slotStart;
      });

      let status = 'Available';
      let available = true;

      if (conflictingBooking) {
        available = false;
        if (conflictingBooking.booking_type === 'social_mixer') {
          status = 'Social Play (Open Mixer)';
        } else if (conflictingBooking.booking_type === 'trial') {
          status = 'Trial Session';
        } else {
          status = 'Booked';
        }
      }

      return {
        id: `${courtId}-${slot.time.replace(/[: ]/g, '')}`,
        time: slot.time,
        available,
        status,
        rate: parseFloat(court.hourly_rate),
        memberRate: parseFloat(court.member_rate),
        isPrime: !!slot.prime
      };
    });

    // 4. Map granular 30-minute interval slots (33 slots per day)
    const thirtyMinSlots = CLUB_THIRTY_MIN_START_TIMES.map(startTime => {
      const endTime = calculateOneHourEndTime(startTime);
      const slotStart = new Date(`${date}T${startTime}:00.000Z`);
      const slotEnd = new Date(`${date}T${endTime}:00.000Z`);

      const conflictingBooking = existingBookings.find(b => {
        const bStart = new Date(b.start_time);
        const bEnd = new Date(b.end_time);
        return bStart < slotEnd && bEnd > slotStart;
      });

      let status = 'Available';
      let available = true;

      if (conflictingBooking) {
        available = false;
        if (conflictingBooking.booking_type === 'social_mixer') {
          status = 'Social Play (Open Mixer)';
        } else if (conflictingBooking.booking_type === 'trial') {
          status = 'Trial Session';
        } else {
          status = 'Booked';
        }
      }

      return {
        id: `${courtId}-${startTime.replace(':', '')}`,
        startTime,
        endTime,
        time: `${startTime} - ${endTime}`,
        available,
        status,
        rate: parseFloat(court.hourly_rate),
        memberRate: parseFloat(court.member_rate),
        isPrime: parseInt(startTime.split(':')[0], 10) >= 17 && parseInt(startTime.split(':')[0], 10) <= 20
      };
    });

    return {
      courtId,
      date,
      slots,
      thirtyMinSlots
    };
  }

  /**
   * Create a new court booking with ACID transaction and exclusion protection
   */
  async createBooking({
    courtId,
    memberId = null,
    guestName = null,
    guestEmail = null,
    guestPhone = null,
    bookingDate,
    startTime,
    endTime,
    bookingType = 'ordinary',
    participants = [],
    notes = null
  }) {
    return withTransaction(async (client) => {
      // 1. Verify court exists and lock court row for share
      const courtRes = await client.query(
        'SELECT * FROM courts WHERE id = $1 AND is_active = true FOR SHARE',
        [courtId]
      );
      if (courtRes.rowCount === 0) {
        const error = new Error(`Court '${courtId}' not found or inactive`);
        error.statusCode = 404;
        error.code = 'COURT_NOT_FOUND';
        throw error;
      }
      const court = courtRes.rows[0];

      // 2. Validate booking times
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        const error = new Error('Invalid start or end time format');
        error.statusCode = 400;
        error.code = 'INVALID_BOOKING_SLOT';
        throw error;
      }

      // Rule 1: Exactly 1 hour
      const durationMs = end.getTime() - start.getTime();
      if (durationMs !== 60 * 60 * 1000) {
        const error = new Error('Invalid booking slot duration: Sessions must be exactly 1 hour');
        error.statusCode = 400;
        error.code = 'INVALID_BOOKING_SLOT';
        throw error;
      }

      // Rule 2: 30-minute interval start times
      const mins = start.getUTCMinutes();
      const localMins = start.getMinutes();
      if (mins !== 0 && mins !== 30 && localMins !== 0 && localMins !== 30) {
        const error = new Error('Invalid booking slot: Start times must occur every 30 minutes (e.g. 14:00, 14:30)');
        error.statusCode = 400;
        error.code = 'INVALID_BOOKING_SLOT';
        throw error;
      }

      // 3. Member Validation & Rule 3: Max 2 plays per club day
      let rateApplied = parseFloat(court.hourly_rate);
      let paymentStatus = 'unpaid';

      if (memberId) {
        // Lock member row for update to guarantee 0 race conditions across concurrent booking requests
        const memRes = await client.query(
          'SELECT id, first_name, last_name, email, phone, status FROM members WHERE id = $1 FOR UPDATE',
          [memberId]
        );

        if (memRes.rowCount === 0) {
          const error = new Error(`Member '${memberId}' not found`);
          error.statusCode = 404;
          error.code = 'MEMBER_NOT_FOUND';
          throw error;
        }

        const member = memRes.rows[0];

        if (member.status !== 'active') {
          const error = new Error(`Active membership required to book court. Member status is '${member.status}'.`);
          error.statusCode = 403;
          error.code = 'MEMBERSHIP_INACTIVE';
          throw error;
        }

        // Verify active membership contract
        const activePlanRes = await client.query(
          `SELECT ms.id, ms.status, ms.start_date, ms.end_date, mp.tier, mp.court_discount_pct
           FROM memberships ms
           JOIN membership_plans mp ON mp.id = ms.plan_id
           WHERE ms.member_id = $1 
             AND ms.status = 'active'
             AND ms.end_date >= CURRENT_DATE
           ORDER BY ms.end_date DESC
           LIMIT 1`,
          [memberId]
        );

        if (activePlanRes.rowCount === 0) {
          const error = new Error('Active membership required to book court. Your membership is inactive or expired.');
          error.statusCode = 403;
          error.code = 'MEMBERSHIP_INACTIVE';
          throw error;
        }

        const membership = activePlanRes.rows[0];

        // Transactionally check daily two-play limit using member_booking_usage and bookings
        const usageRes = await client.query(
          `SELECT COUNT(DISTINCT b.id) AS daily_count
           FROM bookings b
           LEFT JOIN member_booking_usage mbu ON mbu.booking_id = b.id AND mbu.member_id = $1
           LEFT JOIN booking_participants bp ON bp.booking_id = b.id AND bp.member_id = $1
           WHERE (b.member_id = $1 OR mbu.member_id = $1 OR bp.member_id = $1)
             AND b.booking_date = $2
             AND b.status NOT IN ('cancelled', 'no_show')`,
          [memberId, bookingDate]
        );

        const currentDailyPlays = parseInt(usageRes.rows[0].daily_count, 10);
        if (currentDailyPlays >= 2) {
          const error = new Error('Daily booking limit reached: Active members can have at most 2 plays per club day');
          error.statusCode = 422;
          error.code = 'DAILY_BOOKING_LIMIT_REACHED';
          throw error;
        }

        // Rule 4: Authoritative Member Pricing
        if (membership.tier === 'Gold') {
          rateApplied = parseFloat(court.gold_rate || 0.00);
          paymentStatus = 'waived'; // Complimentary
        } else {
          rateApplied = parseFloat(court.member_rate);
          paymentStatus = 'unpaid';
        }
      }

      // Check any member participants for social play
      if (Array.isArray(participants) && participants.length > 0) {
        for (const p of participants) {
          if (p.memberId && p.memberId !== memberId) {
            // Lock and check participant member
            const pMemRes = await client.query(
              'SELECT id, status FROM members WHERE id = $1 FOR UPDATE',
              [p.memberId]
            );
            if (pMemRes.rowCount > 0 && pMemRes.rows[0].status === 'active') {
              const pUsageRes = await client.query(
                `SELECT COUNT(DISTINCT b.id) AS daily_count
                 FROM bookings b
                 LEFT JOIN member_booking_usage mbu ON mbu.booking_id = b.id AND mbu.member_id = $1
                 LEFT JOIN booking_participants bp ON bp.booking_id = b.id AND bp.member_id = $1
                 WHERE (b.member_id = $1 OR mbu.member_id = $1 OR bp.member_id = $1)
                   AND b.booking_date = $2
                   AND b.status NOT IN ('cancelled', 'no_show')`,
                [p.memberId, bookingDate]
              );
              if (parseInt(pUsageRes.rows[0].daily_count, 10) >= 2) {
                const error = new Error(`Participant member '${p.memberId}' has reached the daily limit of 2 plays`);
                error.statusCode = 422;
                error.code = 'DAILY_BOOKING_LIMIT_REACHED';
                throw error;
              }
            }
          }
        }
      }

      // 4. Rule 6: Pre-check Overlap Protection
      const conflictRes = await client.query(
        `SELECT id, booking_number, booking_type FROM bookings
         WHERE court_id = $1
           AND status NOT IN ('cancelled', 'no_show')
           AND tstzrange(start_time, end_time) && tstzrange($2::timestamptz, $3::timestamptz)
         LIMIT 1`,
        [courtId, start.toISOString(), end.toISOString()]
      );

      if (conflictRes.rowCount > 0) {
        const error = new Error('The requested court slot is already booked and conflicts with an existing booking');
        error.statusCode = 409;
        error.code = 'COURT_SLOT_UNAVAILABLE';
        throw error;
      }

      // Total amount
      const totalAmount = rateApplied;

      // Generate booking number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `BK-${new Date().getFullYear()}-${randSuffix}`;

      // Rule 7: Normalize social booking type
      let normalizedType = bookingType;
      if (bookingType === 'social' || bookingType === 'social_mixer') {
        normalizedType = 'social_mixer';
      } else if (!['ordinary', 'trial', 'tournament', 'coaching', 'maintenance'].includes(bookingType)) {
        normalizedType = 'ordinary';
      }

      // 5. Insert booking (Protected by PostgreSQL GiST exclusion constraint against race conditions)
      let booking;
      try {
        const insertRes = await client.query(
          `INSERT INTO bookings (
              booking_number, court_id, member_id, guest_name, guest_email, guest_phone,
              booking_date, start_time, end_time, booking_type, status,
              rate_applied, total_amount, payment_status, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', $11, $12, $13, $14)
           RETURNING *`,
          [
            bookingNumber,
            courtId,
            memberId,
            guestName,
            guestEmail,
            guestPhone,
            bookingDate,
            start.toISOString(),
            end.toISOString(),
            normalizedType,
            rateApplied,
            totalAmount,
            paymentStatus,
            notes
          ]
        );
        booking = insertRes.rows[0];
      } catch (err) {
        if (err.code === '23P01') {
          const conflictError = new Error('The requested court slot is already booked and conflicts with an existing booking.');
          conflictError.statusCode = 409;
          conflictError.code = 'COURT_SLOT_UNAVAILABLE';
          throw conflictError;
        }
        throw err;
      }

      // 6. Rule 7: Manage Participants (Single shared session for social play or ordinary bookings)
      const insertedParticipants = [];

      if (Array.isArray(participants) && participants.length > 0) {
        let hasPrimary = participants.some(p => p.isPrimary);
        for (let i = 0; i < participants.length; i++) {
          const p = participants[i];
          const isPrimary = p.isPrimary ?? (!hasPrimary && i === 0);
          const pRes = await client.query(
            `INSERT INTO booking_participants (booking_id, member_id, name, is_primary)
             VALUES ($1, $2, $3, $4)
             RETURNING id, member_id, name, is_primary`,
            [booking.id, p.memberId || null, p.name || `Player ${i + 1}`, isPrimary]
          );
          insertedParticipants.push(pRes.rows[0]);

          // Track usage for member participants
          if (p.memberId) {
            const periodMonth = bookingDate.slice(0, 7);
            const discount = (p.memberId === memberId)
              ? Math.max(0, parseFloat(court.hourly_rate) - rateApplied)
              : 0.00;
            await client.query(
              `INSERT INTO member_booking_usage (member_id, booking_id, period_month, hours_used, discount_applied)
               VALUES ($1, $2, $3, 1.00, $4)
               ON CONFLICT (member_id, booking_id) DO NOTHING`,
              [p.memberId, booking.id, periodMonth, discount]
            );
          }
        }
      } else {
        const primaryName = guestName || (memberId ? `Member ${memberId}` : 'Primary Player');
        const p1Res = await client.query(
          `INSERT INTO booking_participants (booking_id, member_id, name, is_primary)
           VALUES ($1, $2, $3, true)
           RETURNING id, member_id, name, is_primary`,
          [booking.id, memberId, primaryName]
        );
        insertedParticipants.push(p1Res.rows[0]);

        if (memberId) {
          const periodMonth = bookingDate.slice(0, 7);
          const discountApplied = Math.max(0, parseFloat(court.hourly_rate) - rateApplied);
          await client.query(
            `INSERT INTO member_booking_usage (member_id, booking_id, period_month, hours_used, discount_applied)
             VALUES ($1, $2, $3, 1.00, $4)
             ON CONFLICT (member_id, booking_id) DO NOTHING`,
            [memberId, booking.id, periodMonth, discountApplied]
          );
        }
      }

      return {
        ...booking,
        id: booking.id,
        bookingNumber: booking.booking_number,
        booking_number: booking.booking_number,
        courtId: booking.court_id,
        court_id: booking.court_id,
        courtName: court.name,
        memberId: booking.member_id,
        member_id: booking.member_id,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone,
        bookingDate: booking.booking_date,
        booking_date: booking.booking_date,
        startTime: booking.start_time,
        start_time: booking.start_time,
        endTime: booking.end_time,
        end_time: booking.end_time,
        bookingType: booking.booking_type,
        booking_type: booking.booking_type,
        status: booking.status,
        rateApplied: parseFloat(booking.rate_applied),
        rate_applied: parseFloat(booking.rate_applied),
        totalAmount: parseFloat(booking.total_amount),
        total_amount: parseFloat(booking.total_amount),
        paymentStatus: booking.payment_status,
        payment_status: booking.payment_status,
        notes: booking.notes,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        participants: insertedParticipants
      };
    });
  }

  /**
   * Get single booking by ID with participants
   */
  async getBookingById(bookingId) {
    const res = await query(
      `SELECT b.id, b.booking_number, b.court_id, c.name AS court_name,
              b.member_id, m.first_name, m.last_name, b.guest_name, b.guest_email, b.guest_phone,
              b.booking_date, b.start_time, b.end_time, b.booking_type,
              b.status, b.rate_applied, b.total_amount, b.payment_status,
              b.cancellation_reason, b.notes, b.created_at, b.updated_at
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       LEFT JOIN members m ON m.id = b.member_id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (res.rowCount === 0) {
      const error = new Error(`Booking '${bookingId}' not found`);
      error.statusCode = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }

    const booking = res.rows[0];

    const participantsRes = await query(
      `SELECT id, member_id, name, is_primary, created_at
       FROM booking_participants
       WHERE booking_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [bookingId]
    );

    return {
      id: booking.id,
      bookingNumber: booking.booking_number,
      courtId: booking.court_id,
      courtName: booking.court_name,
      memberId: booking.member_id,
      memberName: booking.first_name ? `${booking.first_name} ${booking.last_name}` : booking.guest_name,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      bookingType: booking.booking_type,
      status: booking.status,
      rateApplied: parseFloat(booking.rate_applied),
      totalAmount: parseFloat(booking.total_amount),
      paymentStatus: booking.payment_status,
      cancellationReason: booking.cancellation_reason,
      notes: booking.notes,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      participants: participantsRes.rows.map(p => ({
        id: p.id,
        memberId: p.member_id,
        name: p.name,
        isPrimary: p.is_primary
      }))
    };
  }

  /**
   * Cancel an existing booking (frees up slot and daily quota immediately)
   */
  async cancelBooking(bookingId, reason = 'Cancelled by user') {
    // 1. Check if booking exists
    const checkRes = await query(
      'SELECT id, status, member_id, booking_date FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (checkRes.rowCount === 0) {
      const error = new Error(`Booking '${bookingId}' not found`);
      error.statusCode = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }

    const existing = checkRes.rows[0];
    if (existing.status === 'cancelled') {
      return {
        ...existing,
        message: 'Booking is already cancelled'
      };
    }

    const res = await query(
      `UPDATE bookings
       SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reason, bookingId]
    );

    // Delete usage record so that member's daily play count is cleanly released
    await query(
      'DELETE FROM member_booking_usage WHERE booking_id = $1',
      [bookingId]
    );

    return res.rows[0];
  }

  /**
   * Add a participant to an existing booking (Social play support)
   */
  async addParticipant(bookingId, { memberId = null, name }) {
    if (!name) {
      const error = new Error('Participant name is required');
      error.statusCode = 400;
      throw error;
    }

    const bookingRes = await query(
      'SELECT id, status, booking_date FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (bookingRes.rowCount === 0) {
      const error = new Error(`Booking '${bookingId}' not found`);
      error.statusCode = 404;
      error.code = 'BOOKING_NOT_FOUND';
      throw error;
    }

    const booking = bookingRes.rows[0];
    if (booking.status === 'cancelled') {
      const error = new Error('Cannot add participant to a cancelled booking');
      error.statusCode = 400;
      throw error;
    }

    if (memberId) {
      const memRes = await query(
        'SELECT id, status FROM members WHERE id = $1',
        [memberId]
      );
      if (memRes.rowCount === 0) {
        const error = new Error(`Member '${memberId}' not found`);
        error.statusCode = 404;
        error.code = 'MEMBER_NOT_FOUND';
        throw error;
      }
    }

    const pRes = await query(
      `INSERT INTO booking_participants (booking_id, member_id, name, is_primary)
       VALUES ($1, $2, $3, false)
       RETURNING id, member_id, name, is_primary, created_at`,
      [bookingId, memberId, name]
    );

    if (memberId) {
      const periodMonth = booking.booking_date.toISOString
        ? booking.booking_date.toISOString().slice(0, 7)
        : String(booking.booking_date).slice(0, 7);
      await query(
        `INSERT INTO member_booking_usage (member_id, booking_id, period_month, hours_used, discount_applied)
         VALUES ($1, $2, $3, 1.00, 0.00)
         ON CONFLICT (member_id, booking_id) DO NOTHING`,
        [memberId, bookingId, periodMonth]
      );
    }

    return pRes.rows[0];
  }

  /**
   * Get member daily booking usage
   */
  async getMemberBookingUsage(memberId, date = new Date().toISOString().split('T')[0]) {
    const memRes = await query(
      'SELECT id, first_name, last_name, status FROM members WHERE id = $1',
      [memberId]
    );

    if (memRes.rowCount === 0) {
      const error = new Error(`Member '${memberId}' not found`);
      error.statusCode = 404;
      error.code = 'MEMBER_NOT_FOUND';
      throw error;
    }

    const usageRes = await query(
      `SELECT DISTINCT b.id, b.booking_number, b.court_id, c.name AS court_name,
              b.start_time, b.end_time, b.status, b.booking_type, b.booking_date
       FROM bookings b
       JOIN courts c ON c.id = b.court_id
       LEFT JOIN member_booking_usage mbu ON mbu.booking_id = b.id AND mbu.member_id = $1
       LEFT JOIN booking_participants bp ON bp.booking_id = b.id AND bp.member_id = $1
       WHERE (b.member_id = $1 OR mbu.member_id = $1 OR bp.member_id = $1)
         AND b.booking_date = $2
         AND b.status NOT IN ('cancelled', 'no_show')
       ORDER BY b.start_time ASC`,
      [memberId, date]
    );

    const activeBookings = usageRes.rows;
    const usedCount = activeBookings.length;
    const maxDaily = 2;
    const remaining = Math.max(0, maxDaily - usedCount);

    return {
      memberId,
      date,
      usedCount,
      maxDaily,
      remaining,
      canBook: usedCount < maxDaily,
      display: `${usedCount}/${maxDaily}`,
      bookings: activeBookings.map(b => ({
        id: b.id,
        bookingNumber: b.booking_number,
        courtId: b.court_id,
        courtName: b.court_name,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        bookingType: b.booking_type
      }))
    };
  }

  /**
   * Get bookings list with filters
   */
  async getBookings({ memberId, courtId, date, status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT b.id, b.booking_number, b.court_id, c.name AS court_name,
             b.member_id, m.first_name, m.last_name, b.guest_name,
             b.booking_date, b.start_time, b.end_time, b.booking_type,
             b.status, b.rate_applied, b.total_amount, b.payment_status, b.created_at
      FROM bookings b
      JOIN courts c ON c.id = b.court_id
      LEFT JOIN members m ON m.id = b.member_id
      WHERE 1=1
    `;
    const params = [];

    if (memberId) {
      params.push(memberId);
      sql += ` AND b.member_id = $${params.length}`;
    }
    if (courtId) {
      params.push(courtId);
      sql += ` AND b.court_id = $${params.length}`;
    }
    if (date) {
      params.push(date);
      sql += ` AND b.booking_date = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND b.status = $${params.length}`;
    }

    sql += ` ORDER BY b.start_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows.map(b => ({
      id: b.id,
      bookingNumber: b.booking_number,
      courtId: b.court_id,
      courtName: b.court_name,
      memberId: b.member_id,
      memberName: b.first_name ? `${b.first_name} ${b.last_name}` : b.guest_name,
      guestName: b.guest_name,
      bookingDate: b.booking_date,
      startTime: b.start_time,
      endTime: b.end_time,
      bookingType: b.booking_type,
      status: b.status,
      rateApplied: parseFloat(b.rate_applied),
      totalAmount: parseFloat(b.total_amount),
      paymentStatus: b.payment_status,
      createdAt: b.created_at
    }));
  }
}

module.exports = new BookingService();
