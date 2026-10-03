/**
 * Champions Club - Canonical Database Integrity Test Suite
 * Role: MEMBER 3 (Canonical Database Owner)
 * 
 * Tests:
 * 1. Schema completeness (all 30 canonical tables)
 * 2. Check constraints & data validation
 * 3. Foreign key constraints & cascade behaviors
 * 4. Unique constraints & duplicate prevention
 * 5. PostgreSQL-level court booking non-overlapping exclusion protection
 * 6. Seed data correctness & consistency
 */

const { pool } = require('../src/config/database');
const { initSchema } = require('../src/db/init');
const { seedDatabase } = require('../src/db/seed');

const REQUIRED_TABLES = [
  'users',
  'members',
  'membership_plans',
  'memberships',
  'sports',
  'courts',
  'bookings',
  'booking_participants',
  'member_booking_usage',
  'products',
  'product_categories',
  'inventory',
  'stock_movements',
  'shop_orders',
  'shop_order_items',
  'bar_tables',
  'menu_items',
  'bar_orders',
  'bar_order_items',
  'leads',
  'lead_followups',
  'quotations',
  'trial_bookings',
  'employees',
  'staff_shifts',
  'leave_requests',
  'invoices',
  'invoice_items',
  'payments',
  'expenses'
];

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    testsPassed++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - CANONICAL DATABASE INTEGRITY TESTS');
  console.log('===============================================================\n');

  try {
    // ------------------------------------------------------------------------
    // TEST SUITE 1: FRESH DB INITIALIZATION & SCHEMA VERIFICATION
    // ------------------------------------------------------------------------
    console.log('[TEST SUITE 1] Fresh Database Initialization & Table Verification');
    await initSchema();
    await seedDatabase();

    const tableRes = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const existingTables = tableRes.rows.map(r => r.table_name);

    for (const table of REQUIRED_TABLES) {
      assert(
        existingTables.includes(table),
        `Canonical table '${table}' exists in database`
      );
    }
    assert(REQUIRED_TABLES.length === 30, 'Verified all 30 canonical domain tables');

    // ------------------------------------------------------------------------
    // TEST SUITE 2: UNIQUE CONSTRAINTS & DUPLICATE PREVENTION
    // ------------------------------------------------------------------------
    console.log('\n[TEST SUITE 2] Unique Constraints & Duplicate Prevention');

    // Duplicate user email
    let duplicateEmailFailed = false;
    try {
      await pool.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ('admin@championsclub.com', 'hash', 'admin', 'Dup', 'Admin')`
      );
    } catch (err) {
      duplicateEmailFailed = err.code === '23505';
    }
    assert(duplicateEmailFailed, 'Rejected duplicate user email (23505 unique violation)');

    // Duplicate member number
    let duplicateMemberNumFailed = false;
    try {
      await pool.query(
        `INSERT INTO members (id, member_number, first_name, last_name, email, phone)
         VALUES ('MEM-9999', 'CC-2026-8801', 'Test', 'Dup', 'unique@email.com', '123')`
      );
    } catch (err) {
      duplicateMemberNumFailed = err.code === '23505';
    }
    assert(duplicateMemberNumFailed, 'Rejected duplicate member_number (23505 unique violation)');

    // Duplicate bar table number
    let duplicateTableNumFailed = false;
    try {
      await pool.query(
        `INSERT INTO bar_tables (id, number, name, section)
         VALUES ('table-99', 1, 'Duplicate Table 1', 'Lounge')`
      );
    } catch (err) {
      duplicateTableNumFailed = err.code === '23505';
    }
    assert(duplicateTableNumFailed, 'Rejected duplicate bar table number (23505 unique violation)');

    // ------------------------------------------------------------------------
    // TEST SUITE 3: CHECK CONSTRAINTS & INTEGRITY CHECKS
    // ------------------------------------------------------------------------
    console.log('\n[TEST SUITE 3] Check Constraints & Domain Integrity');

    // Invalid user role
    let invalidRoleFailed = false;
    try {
      await pool.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ('invalid_role@test.com', 'hash', 'super_hacker', 'Test', 'User')`
      );
    } catch (err) {
      invalidRoleFailed = err.code === '23514';
    }
    assert(invalidRoleFailed, 'Rejected invalid user role (23514 check constraint violation)');

    // Negative court hourly rate
    let negativeRateFailed = false;
    try {
      await pool.query(
        `INSERT INTO courts (id, sport_id, name, surface, hourly_rate, member_rate)
         VALUES ('court-neg', 'tennis', 'Neg Court', 'Hard', -100.00, 50.00)`
      );
    } catch (err) {
      negativeRateFailed = err.code === '23514';
    }
    assert(negativeRateFailed, 'Rejected negative court hourly rate (23514 check constraint violation)');

    // Invalid booking time (end_time <= start_time)
    let invalidBookingTimeFailed = false;
    try {
      const today = new Date().toISOString().split('T')[0];
      await pool.query(
        `INSERT INTO bookings (
            booking_number, court_id, booking_date, start_time, end_time, rate_applied, total_amount
         )
         VALUES (
            'BK-ERR-01', 'court-1', $1,
            '2026-10-05T12:00:00Z', '2026-10-05T10:00:00Z', 800, 800
         )`,
        [today]
      );
    } catch (err) {
      invalidBookingTimeFailed = err.code === '23514';
    }
    assert(invalidBookingTimeFailed, 'Rejected booking where end_time <= start_time (23514 check constraint violation)');

    // ------------------------------------------------------------------------
    // TEST SUITE 4: FOREIGN KEYS & CASCADE BEHAVIOR
    // ------------------------------------------------------------------------
    console.log('\n[TEST SUITE 4] Foreign Keys & Cascade Constraints');

    // RESTRICT on deleting sport with active courts
    let restrictSportDeleteFailed = false;
    try {
      await pool.query("DELETE FROM sports WHERE id = 'tennis'");
    } catch (err) {
      restrictSportDeleteFailed = err.code === '23503' || err.code === '23001';
    }
    assert(restrictSportDeleteFailed, 'ON DELETE RESTRICT prevented deleting sport with active courts (23001/23503 FK violation)');

    // CASCADE delete on shop_order -> shop_order_items
    const orderRes = await pool.query(
      `INSERT INTO shop_orders (order_number, subtotal, total_amount)
       VALUES ('SO-TEST-CASCADE', 1000, 1000)
       RETURNING id`
    );
    const orderId = orderRes.rows[0].id;

    await pool.query(
      `INSERT INTO shop_order_items (shop_order_id, product_id, quantity, unit_price, total_price)
       VALUES ($1, 'prod-1', 1, 1000, 1000)`,
      [orderId]
    );

    await pool.query('DELETE FROM shop_orders WHERE id = $1', [orderId]);
    const orphanItems = await pool.query(
      'SELECT 1 FROM shop_order_items WHERE shop_order_id = $1',
      [orderId]
    );
    assert(orphanItems.rowCount === 0, 'ON DELETE CASCADE cleaned up shop_order_items when parent order was deleted');

    // ------------------------------------------------------------------------
    // TEST SUITE 5: POSTGRESQL EXCLUSION CONSTRAINT & BOOKING CONFLICT PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n[TEST SUITE 5] PostgreSQL Exclusion Constraint & Booking Overlap Protection');

    const testDate = '2026-11-20';
    const startWindow = `${testDate}T10:00:00.000Z`;
    const endWindow = `${testDate}T11:00:00.000Z`;

    // 1. First booking succeeds
    const booking1 = await pool.query(
      `INSERT INTO bookings (
          booking_number, court_id, booking_date, start_time, end_time,
          booking_type, status, rate_applied, total_amount
       )
       VALUES (
          'BK-EXCL-01', 'court-1', $1, $2, $3,
          'ordinary', 'confirmed', 800, 800
       )
       RETURNING id`,
      [testDate, startWindow, endWindow]
    );
    assert(booking1.rowCount === 1, 'Initial court booking created successfully');

    // 2. Exact same time slot on same court MUST be rejected by PostgreSQL Exclusion Constraint
    let overlapRejectedExact = false;
    try {
      await pool.query(
        `INSERT INTO bookings (
            booking_number, court_id, booking_date, start_time, end_time,
            booking_type, status, rate_applied, total_amount
         )
         VALUES (
            'BK-EXCL-02', 'court-1', $1, $2, $3,
            'ordinary', 'confirmed', 800, 800
         )`,
        [testDate, startWindow, endWindow]
      );
    } catch (err) {
      overlapRejectedExact = err.code === '23P01'; // exclusion_violation
    }
    assert(overlapRejectedExact, 'PostgreSQL Exclusion Constraint rejected exact overlapping booking on court-1 (23P01 exclusion_violation)');

    // 3. Partial overlap (e.g. 10:30 - 11:30) MUST also be rejected
    let partialOverlapRejected = false;
    try {
      await pool.query(
        `INSERT INTO bookings (
            booking_number, court_id, booking_date, start_time, end_time,
            booking_type, status, rate_applied, total_amount
         )
         VALUES (
            'BK-EXCL-03', 'court-1', $1, $2, $3,
            'ordinary', 'confirmed', 800, 800
         )`,
        [testDate, `${testDate}T10:30:00.000Z`, `${testDate}T11:30:00.000Z`]
      );
    } catch (err) {
      partialOverlapRejected = err.code === '23P01';
    }
    assert(partialOverlapRejected, 'PostgreSQL Exclusion Constraint rejected partial overlapping booking 10:30-11:30 (23P01)');

    // 4. Same time slot on a DIFFERENT court (court-2) MUST succeed
    const differentCourtBooking = await pool.query(
      `INSERT INTO bookings (
          booking_number, court_id, booking_date, start_time, end_time,
          booking_type, status, rate_applied, total_amount
       )
       VALUES (
          'BK-EXCL-04', 'court-2', $1, $2, $3,
          'ordinary', 'confirmed', 700, 700
       )
       RETURNING id`,
      [testDate, startWindow, endWindow]
    );
    assert(differentCourtBooking.rowCount === 1, 'Simultaneous booking on different court (court-2) succeeded without interference');

    // 5. Cancelled booking allows new booking in the same slot
    await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE booking_number = 'BK-EXCL-01'"
    );

    const rebookedSlot = await pool.query(
      `INSERT INTO bookings (
          booking_number, court_id, booking_date, start_time, end_time,
          booking_type, status, rate_applied, total_amount
       )
       VALUES (
          'BK-EXCL-05', 'court-1', $1, $2, $3,
          'ordinary', 'confirmed', 800, 800
       )
       RETURNING id`,
      [testDate, startWindow, endWindow]
    );
    assert(rebookedSlot.rowCount === 1, 'Freed slot was successfully re-booked after previous booking cancellation');

    // ------------------------------------------------------------------------
    // TEST SUITE 6: SEED DATA INTEGRITY & RELATIONAL FIDELITY
    // ------------------------------------------------------------------------
    console.log('\n[TEST SUITE 6] Seed Data Integrity & Relational Fidelity');

    const courtsCount = await pool.query('SELECT COUNT(*) FROM courts');
    assert(parseInt(courtsCount.rows[0].count, 10) === 5, 'Verified 5 fallback courts (Centre Court, Clay, Box Cricket 1 & 2, Padel Alpha)');

    const plansCount = await pool.query('SELECT COUNT(*) FROM membership_plans');
    assert(parseInt(plansCount.rows[0].count, 10) === 3, 'Verified 3 membership tiers (Gold, Silver, Junior)');

    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    assert(parseInt(productsCount.rows[0].count, 10) === 8, 'Verified 8 pro-shop products (prod-1 to prod-8)');

    const tablesCount = await pool.query('SELECT COUNT(*) FROM bar_tables');
    assert(parseInt(tablesCount.rows[0].count, 10) === 8, 'Verified 8 bar tables (table-1 to table-8)');

    const menuCount = await pool.query('SELECT COUNT(*) FROM menu_items');
    assert(parseInt(menuCount.rows[0].count, 10) === 16, 'Verified 16 bar and lounge menu items');

    const employeesCount = await pool.query('SELECT COUNT(*) FROM employees');
    assert(parseInt(employeesCount.rows[0].count, 10) === 4, 'Verified 4 staff members (STF-001 to STF-004)');

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('===============================================================\n');

    await pool.end();
    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ FATAL TEST ERROR:', err);
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
