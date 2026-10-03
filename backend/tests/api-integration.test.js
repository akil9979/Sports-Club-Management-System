/**
 * Champions Club - Backend API Integration Tests
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const http = require('http');
const app = require('../src/app');
const config = require('../src/config/env');
const { initSchema } = require('../src/db/init');
const { seedDatabase } = require('../src/db/seed');
const { pool } = require('../src/config/database');

let server;
let baseUrl;

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
      res.on('data', chunk => data += chunk);
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
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
  }
}

async function runApiTests() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - API INTEGRATION & ROUTE VERIFICATION');
  console.log('===============================================================\n');

  try {
    // 1. Reset database with schema and seed
    await initSchema();
    await seedDatabase();

    // 2. Start HTTP server on test port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`[Test Server] Listening on ${baseUrl}\n`);
        resolve();
      });
    });

    // ------------------------------------------------------------------------
    // API TEST 1: HEALTH CHECK
    // ------------------------------------------------------------------------
    console.log('[API TEST 1] Health Check Endpoint');
    const healthRes = await request('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returned HTTP 200');
    assert(healthRes.body.database.connected === true, 'Database connection is verified healthy');

    // ------------------------------------------------------------------------
    // API TEST 2: PUBLIC CONTRACT ENDPOINTS (MEMBERSHIP PLANS & COURTS)
    // ------------------------------------------------------------------------
    console.log('\n[API TEST 2] Public Contract Endpoints');
    const plansRes = await request('/api/membership-plans');
    assert(plansRes.status === 200, 'GET /api/membership-plans returned HTTP 200');
    assert(Array.isArray(plansRes.body) && plansRes.body.length === 3, 'Received all 3 canonical plans matching frontend');

    const courtsRes = await request('/api/courts');
    assert(courtsRes.status === 200, 'GET /api/courts returned HTTP 200');
    assert(Array.isArray(courtsRes.body) && courtsRes.body.length === 5, 'Received all 5 active courts');

    const availRes = await request('/api/bookings/availability?courtId=court-1&date=2026-10-15');
    assert(availRes.status === 200, 'GET /api/bookings/availability returned HTTP 200');
    assert(availRes.body.slots && availRes.body.slots.length === 15, 'Generated full operating slots for court-1');

    // ------------------------------------------------------------------------
    // API TEST 3: AUTHENTICATION (REGISTER, LOGIN, ME, PIN-LOGIN)
    // ------------------------------------------------------------------------
    console.log('\n[API TEST 3] Authentication Flow');
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        email: 'newplayer@example.com',
        password: 'Password@123',
        firstName: 'Test',
        lastName: 'Player',
        phone: '+919988776655'
      }
    });
    assert(regRes.status === 201, 'POST /api/auth/register returned HTTP 201');
    assert(regRes.body.data.token, 'Registration issued valid JWT token');
    assert(regRes.body.data.member && regRes.body.data.member.id, 'Created member record automatically for new user');

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@championsclub.com',
        password: 'Password@123'
      }
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returned HTTP 200 for Admin');
    const adminToken = loginRes.body.data.token;

    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(meRes.status === 200, 'GET /api/auth/me returned profile details');
    assert(meRes.body.data.email === 'admin@championsclub.com', 'Profile matches authenticated user');

    const pinRes = await request('/api/auth/pin-login', {
      method: 'POST',
      body: { pin: '1234', employeeId: 'STF-001' }
    });
    assert(pinRes.status === 200, 'POST /api/auth/pin-login returned HTTP 200 for Bar Manager');

    // ------------------------------------------------------------------------
    // API TEST 4: COURT BOOKINGS & CONCURRENCY CONFLICT HANDLING
    // ------------------------------------------------------------------------
    console.log('\n[API TEST 4] Court Booking Creation & Slot Conflict');
    const bookingPayload = {
      courtId: 'court-1',
      bookingDate: '2026-11-25',
      startTime: '2026-11-25T14:00:00.000Z',
      endTime: '2026-11-25T15:00:00.000Z',
      guestName: 'Tournament Participant',
      guestEmail: 'tournament@example.com'
    };

    const book1Res = await request('/api/bookings', {
      method: 'POST',
      body: bookingPayload
    });
    assert(book1Res.status === 201, 'POST /api/bookings confirmed new court reservation (HTTP 201)');
    const createdBookingId = book1Res.body.data.id;

    // Attempt overlapping reservation on the exact same court and slot
    const bookConflictRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        ...bookingPayload,
        guestName: 'Second Contender'
      }
    });
    assert(bookConflictRes.status === 409, 'POST /api/bookings rejected overlapping booking with HTTP 409 Conflict');

    // Cancel first booking
    const cancelRes = await request(`/api/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { reason: 'Schedule adjustment' }
    });
    assert(cancelRes.status === 200, 'PATCH /api/bookings/:id/cancel cancelled booking successfully');

    // Rebook freed slot
    const rebookRes = await request('/api/bookings', {
      method: 'POST',
      body: {
        ...bookingPayload,
        guestName: 'New Slot Owner'
      }
    });
    assert(rebookRes.status === 201, 'POST /api/bookings successfully reserved previously freed slot (HTTP 201)');

    // ------------------------------------------------------------------------
    // API TEST 5: MEMBERSHIP SUBSCRIPTION & MEMBER PROFILE
    // ------------------------------------------------------------------------
    console.log('\n[API TEST 5] Membership Subscription & Member Profile');
    const subRes = await request('/api/memberships/subscribe', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        memberId: 'MEM-4920',
        planId: 'gold',
        billingCycle: 'annual'
      }
    });
    assert(subRes.status === 201, 'POST /api/memberships/subscribe upgraded member to Gold plan (HTTP 201)');

    const memberDetailRes = await request('/api/members/MEM-4920', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(memberDetailRes.status === 200, 'GET /api/members/:id returned member with active membership');
    assert(memberDetailRes.body.data.membership.plan_tier === 'Gold', 'Member tier verified as upgraded Gold');

    // ------------------------------------------------------------------------
    // API TEST 6: SHOP CATALOGUE, ORDERS & LOW-STOCK
    // ------------------------------------------------------------------------
    console.log('\n[API TEST 6] Shop Catalogue, Inventory & Order Lifecycle');
    const prodsRes = await request('/api/products?category=Tennis');
    assert(prodsRes.status === 200, 'GET /api/products returned HTTP 200');
    assert(Array.isArray(prodsRes.body), 'Products returned as array');

    const lowStockApiRes = await request('/api/inventory/low-stock', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(lowStockApiRes.status === 200, 'GET /api/inventory/low-stock returned HTTP 200');

    const shopOrderRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        orderType: 'online_delivery',
        fulfilmentType: 'delivery',
        customerName: 'Online Shopper',
        deliveryAddress: '123 Tennis Lane',
        items: [{ productId: 'prod-1', quantity: 1 }]
      }
    });
    assert(shopOrderRes.status === 201, 'POST /api/shop/orders created delivery order (HTTP 201)');

    const orderDetailRes = await request(`/api/shop/orders/${shopOrderRes.body.data.id}`);
    assert(orderDetailRes.status === 200, 'GET /api/shop/orders/:id returned order details');
    assert(orderDetailRes.body.data.fulfilmentType === 'delivery', 'Verified delivery fulfilment');

    console.log('\n===============================================================');
    console.log('API INTEGRATION TESTS COMPLETE: ALL ENDPOINTS VERIFIED!');
    console.log('===============================================================\n');

    server.close();
    await pool.end();
  } catch (err) {
    console.error('\n❌ FATAL API TEST ERROR:', err);
    if (server) server.close();
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  runApiTests();
}

module.exports = { runApiTests };
