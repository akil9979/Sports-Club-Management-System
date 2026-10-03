/**
 * Champions Club - Court Bookings Service
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { query, withTransaction } = require('../../config/database');

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

class BookingService {
  /**
   * Get all active courts
   */
  async getCourts() {
    const res = await query(
      `SELECT c.id, c.name, s.name AS type, c.surface, c.indoor, c.lighting,
              c.hourly_rate, c.member_rate, c.gold_rate, c.max_players, c.description
       FROM courts c
       JOIN sports s ON s.id = c.sport_id
       WHERE c.is_active = true
       ORDER BY c.name ASC`
    );

    return res.rows.map(court => ({
      id: court.id,
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
    // 1. Get court details
    const courtRes = await query(
      `SELECT c.id, c.name, c.hourly_rate, c.member_rate, c.gold_rate
       FROM courts c
       WHERE c.id = $1`,
      [courtId]
    );

    if (courtRes.rowCount === 0) {
      const error = new Error(`Court '${courtId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const court = courtRes.rows[0];

    // 2. Fetch existing confirmed bookings for this court and date
    const bookingsRes = await query(
      `SELECT id, booking_type, status, start_time, end_time
       FROM bookings
       WHERE court_id = $1 
         AND booking_date = $2
         AND status NOT IN ('cancelled', 'no_show')`,
      [courtId, date]
    );

    const existingBookings = bookingsRes.rows;

    // 3. Map slot availability
    const slots = CLUB_OPERATING_SLOTS.map(slot => {
      const slotStart = new Date(`${date}T${String(slot.startHour).padStart(2, '0')}:00:00.000Z`);
      const slotEnd = new Date(`${date}T${String(slot.endHour).padStart(2, '0')}:00:00.000Z`);

      // Check overlap
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

    return {
      courtId,
      date,
      slots
    };
  }

  /**
   * Create a new booking with ACID transaction and exclusion protection
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
    notes = null
  }) {
    return withTransaction(async (client) => {
      // 1. Verify court exists and lock court row for update
      const courtRes = await client.query(
        'SELECT * FROM courts WHERE id = $1 AND is_active = true FOR SHARE',
        [courtId]
      );
      if (courtRes.rowCount === 0) {
        const error = new Error(`Court '${courtId}' not found or inactive`);
        error.statusCode = 404;
        throw error;
      }
      const court = courtRes.rows[0];

      // 2. Determine member pricing if memberId provided
      let rateApplied = parseFloat(court.hourly_rate);
      let paymentStatus = 'unpaid';

      if (memberId) {
        const memRes = await client.query(
          `SELECT ms.status, mp.tier, mp.court_discount_pct
           FROM memberships ms
           JOIN membership_plans mp ON mp.id = ms.plan_id
           WHERE ms.member_id = $1 AND ms.status = 'active'
           ORDER BY ms.end_date DESC LIMIT 1`,
          [memberId]
        );

        if (memRes.rowCount > 0) {
          const tier = memRes.rows[0].tier;
          if (tier === 'Gold') {
            rateApplied = parseFloat(court.gold_rate || 0);
            paymentStatus = 'waived'; // 100% complimentary
          } else {
            rateApplied = parseFloat(court.member_rate);
          }
        } else {
          rateApplied = parseFloat(court.member_rate);
        }
      }

      // 3. Compute duration & total amount
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationHours = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 1);
      const totalAmount = rateApplied * durationHours;

      // 4. Generate human-readable booking number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `BK-${new Date().getFullYear()}-${randSuffix}`;

      // 5. Insert booking (PostgreSQL exclusion constraint ensures 100% concurrency safety)
      const bookingInsert = await client.query(
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
          bookingType,
          rateApplied,
          totalAmount,
          paymentStatus,
          notes
        ]
      );

      const booking = bookingInsert.rows[0];

      // 6. Insert primary participant
      const participantName = guestName || (memberId ? `Member ${memberId}` : 'Primary Player');
      await client.query(
        `INSERT INTO booking_participants (booking_id, member_id, name, is_primary)
         VALUES ($1, $2, $3, true)`,
        [booking.id, memberId, participantName]
      );

      // 7. Track member usage if applicable
      if (memberId) {
        const periodMonth = bookingDate.slice(0, 7);
        await client.query(
          `INSERT INTO member_booking_usage (member_id, booking_id, period_month, hours_used, discount_applied)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (member_id, booking_id) DO NOTHING`,
          [memberId, booking.id, periodMonth, durationHours, (parseFloat(court.hourly_rate) - rateApplied) * durationHours]
        );
      }

      return booking;
    });
  }

  /**
   * Cancel an existing booking (frees up slot)
   */
  async cancelBooking(bookingId, reason = 'Cancelled by user') {
    const res = await query(
      `UPDATE bookings
       SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status != 'cancelled'
       RETURNING *`,
      [reason, bookingId]
    );

    if (res.rowCount === 0) {
      const error = new Error(`Booking '${bookingId}' not found or already cancelled`);
      error.statusCode = 404;
      throw error;
    }

    return res.rows[0];
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
    return res.rows;
  }
}

module.exports = new BookingService();
