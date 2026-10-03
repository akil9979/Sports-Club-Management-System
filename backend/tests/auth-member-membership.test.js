/**
 * Champions Club - Auth, Member & Membership Subsystem Automated Integration Tests
 * Role: MEMBER 3 (Canonical Database Owner)
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

async function runAuthMemberMembershipTests() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - AUTH, MEMBER & MEMBERSHIP INTEGRATION SUITE');
  console.log('===============================================================\n');

  try {
    // 1. Reset database
    await initSchema();
    await seedDatabase();

    // 2. Start HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`[Test Server] Listening on ${baseUrl}\n`);
        resolve();
      });
    });

    let adminToken;
    let memberToken;

    // ------------------------------------------------------------------------
    // TEST SUITE 1: AUTHENTICATION (LOGIN, LOGOUT, ME & UNAUTHORIZED)
    // ------------------------------------------------------------------------
    console.log('[TEST 1] Authentication Flow & Security');

    // 1.1 Login success
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@championsclub.com', password: 'Password@123' }
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returned HTTP 200 for Admin');
    assert(Boolean(loginRes.body.data?.token), 'Admin login returned valid JWT token');
    adminToken = loginRes.body.data.token;

    // 1.2 Member login success
    const memberLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'devon.conway@example.com', password: 'Password@123' }
    });
    assert(memberLoginRes.status === 200, 'POST /api/auth/login returned HTTP 200 for Member');
    assert(memberLoginRes.body.data?.user?.memberId === 'MEM-8801', 'Member login attached active memberId');
    assert(memberLoginRes.body.data?.user?.membership?.plan_tier === 'Gold', 'Member login attached active Gold membership');
    memberToken = memberLoginRes.body.data.token;

    // 1.3 Login failure - Wrong password
    const wrongPassRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@championsclub.com', password: 'IncorrectPassword' }
    });
    assert(wrongPassRes.status === 401, 'POST /api/auth/login rejected wrong password with HTTP 401');

    // 1.4 Login failure - Unknown user
    const unknownUserRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'unknown.ghost@example.com', password: 'Password@123' }
    });
    assert(unknownUserRes.status === 401, 'POST /api/auth/login rejected non-existent email with HTTP 401');

    // 1.5 GET /api/auth/me with valid token
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(meRes.status === 200, 'GET /api/auth/me returned HTTP 200 for authenticated admin');
    assert(meRes.body.data?.email === 'admin@championsclub.com', 'GET /api/auth/me resolved correct user profile');

    // 1.6 GET /api/auth/me with member token
    const memberMeRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    assert(memberMeRes.status === 200, 'GET /api/auth/me returned HTTP 200 for member');
    assert(memberMeRes.body.data?.member?.id === 'MEM-8801', 'GET /api/auth/me returned associated member profile');
    assert(memberMeRes.body.data?.member?.membership?.plan_tier === 'Gold', 'GET /api/auth/me included member active tier');

    // 1.7 Unauthorized Access - Missing Token
    const unauthRes = await request('/api/auth/me');
    assert(unauthRes.status === 401, 'GET /api/auth/me rejected missing token with HTTP 401');

    // 1.8 Unauthorized Access - Invalid Token Signature
    const bogusTokenRes = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer invalid.bogus.jwt.token' }
    });
    assert(bogusTokenRes.status === 401, 'GET /api/auth/me rejected bogus token signature with HTTP 401');

    // 1.9 POST /api/auth/logout
    const logoutRes = await request('/api/auth/logout', { method: 'POST' });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returned HTTP 200');
    assert(logoutRes.body.success === true, 'Logout acknowledged successfully');

    // ------------------------------------------------------------------------
    // TEST SUITE 2: MEMBERSHIP PLANS CATALOGUE
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Membership Plans Catalogue');
    const plansRes = await request('/api/membership-plans');
    assert(plansRes.status === 200, 'GET /api/membership-plans returned HTTP 200');
    assert(Array.isArray(plansRes.body), 'Plans returned as array');
    assert(plansRes.body.length === 3, 'Found exactly 3 canonical active plans (Gold, Silver, Junior)');

    const juniorPlan = plansRes.body.find(p => p.id === 'junior');
    assert(Boolean(juniorPlan), 'Junior Rising Star plan exists in catalogue');
    assert(juniorPlan.tier === 'Junior', 'Junior plan tier is marked Junior');
    assert(juniorPlan.price === 1499, 'Junior plan monthly price is 1499');

    // ------------------------------------------------------------------------
    // TEST SUITE 3: MEMBER MANAGEMENT (CREATE, LIST, GET, PATCH, DUPLICATE)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Member Management CRUD & Constraints');

    // 3.1 Create Adult Member
    const createAdultRes = await request('/api/members', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        firstName: 'Vikram',
        lastName: 'Rathore',
        email: 'vikram.rathore@example.com',
        phone: '+919876500111',
        gender: 'male',
        dateOfBirth: '1990-05-15',
        address: '14 Palace Greens',
        emergencyContactName: 'Geeta Rathore',
        emergencyContactPhone: '+919876500112',
        password: 'Password@123',
        planId: 'silver',
        billingCycle: 'monthly'
      }
    });
    assert(createAdultRes.status === 201, 'POST /api/members created new adult member (HTTP 201)');
    assert(Boolean(createAdultRes.body.data?.id), 'Assigned unique member ID');
    assert(createAdultRes.body.data?.membership?.planTier === 'Silver', 'Attached initial Silver membership');
    const adultMemberId = createAdultRes.body.data.id;

    // 3.2 Duplicate Email Rejection (Conflict 409)
    const duplicateRes = await request('/api/members', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'vikram.rathore@example.com',
        phone: '+919876500999'
      }
    });
    assert(duplicateRes.status === 409, 'POST /api/members rejected duplicate email with HTTP 409 Conflict');

    // 3.3 List Members with search and pagination
    const listRes = await request('/api/members?search=Vikram', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listRes.status === 200, 'GET /api/members returned HTTP 200');
    assert(listRes.body.data.length >= 1, 'Search found newly created member');

    // 3.4 Get Member Details by ID (Includes Active Membership + History + Stats)
    const detailRes = await request(`/api/members/${adultMemberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(detailRes.status === 200, 'GET /api/members/:id returned HTTP 200');
    assert(detailRes.body.data.id === adultMemberId, 'Returned matching member ID');
    assert(detailRes.body.data.membership?.plan_name === 'Silver Standard', 'Member has active Silver membership');
    assert(Array.isArray(detailRes.body.data.memberships), 'Member detail includes memberships history list');
    assert(typeof detailRes.body.data.stats?.totalBookings === 'number', 'Member detail includes stats');

    // 3.5 Update Member Profile (PATCH)
    const patchRes = await request(`/api/members/${adultMemberId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        address: '99 Royal Palm Drive',
        emergencyContactName: 'Anita Rathore'
      }
    });
    assert(patchRes.status === 200, 'PATCH /api/members/:id returned HTTP 200');
    assert(patchRes.body.data.address === '99 Royal Palm Drive', 'Updated member address persisted');
    assert(patchRes.body.data.emergency_contact_name === 'Anita Rathore', 'Updated emergency contact persisted');

    // ------------------------------------------------------------------------
    // TEST SUITE 4: MEMBERSHIP CREATION, JUNIOR VALIDATION & DATE INTEGRITY
    // ------------------------------------------------------------------------
    console.log('\n[TEST 4] Membership Subscription, Junior Eligibility & Date Integrity');

    // 4.1 Adult member attempts to subscribe to Junior plan -> MUST BE REJECTED (422)
    const adultJuniorRes = await request(`/api/members/${adultMemberId}/memberships`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        planId: 'junior',
        billingCycle: 'monthly'
      }
    });
    assert(adultJuniorRes.status === 422, 'POST /api/members/:id/memberships rejected adult for Junior plan (HTTP 422)');
    assert(
      adultJuniorRes.body.message && adultJuniorRes.body.message.includes('not eligible for Junior membership'),
      'Clear error message explaining adult age ineligibility'
    );

    // 4.2 Member without DOB attempts to subscribe to Junior plan -> MUST BE REJECTED (422)
    const noDobMemberRes = await request('/api/members', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        firstName: 'NoDob',
        lastName: 'Member',
        email: 'nodob.member@example.com',
        phone: '+919876500222'
      }
    });
    assert(noDobMemberRes.status === 201, 'Created member without DOB');
    const noDobMemberId = noDobMemberRes.body.data.id;

    const noDobJuniorRes = await request(`/api/members/${noDobMemberId}/memberships`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        planId: 'junior',
        billingCycle: 'monthly'
      }
    });
    assert(noDobJuniorRes.status === 422, 'POST /api/members/:id/memberships rejected member without DOB for Junior plan (HTTP 422)');

    // 4.3 Create Junior Member (14 years old, born 2012)
    const createJuniorRes = await request('/api/members', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        firstName: 'Aarav',
        lastName: 'Mehta',
        email: 'aarav.mehta@example.com',
        phone: '+919876500333',
        gender: 'male',
        dateOfBirth: '2012-08-10', // 14 years old
        address: '10 Academy Road',
        emergencyContactName: 'Sanjay Mehta',
        emergencyContactPhone: '+919876500334',
        planId: 'junior',
        billingCycle: 'monthly'
      }
    });
    assert(createJuniorRes.status === 201, 'POST /api/members successfully created Junior member (HTTP 201)');
    assert(createJuniorRes.body.data.membership?.planTier === 'Junior', 'Junior membership assigned successfully');
    const juniorMemberId = createJuniorRes.body.data.id;

    // 4.4 Junior member subscribes to annual Junior plan via /api/members/:id/memberships
    const juniorAnnualRes = await request(`/api/members/${juniorMemberId}/memberships`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        planId: 'junior',
        billingCycle: 'annual'
      }
    });
    assert(juniorAnnualRes.status === 201, 'POST /api/members/:id/memberships created annual Junior membership (HTTP 201)');
    assert(juniorAnnualRes.body.data.membership.status === 'active', 'New membership is active');
    assert(juniorAnnualRes.body.data.membership.payment_frequency === 'annual', 'Annual billing cycle recorded');

    // 4.5 Invalid Date Range Validation (endDate < startDate)
    const invalidDateRes = await request(`/api/members/${adultMemberId}/memberships`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        planId: 'gold',
        startDate: '2026-12-01',
        endDate: '2026-10-01' // End before start
      }
    });
    assert(invalidDateRes.status === 422, `POST /api/members/:id/memberships rejected invalid date range with HTTP 422 (Received: HTTP ${invalidDateRes.status}, Body: ${JSON.stringify(invalidDateRes.body)})`);

    // 4.6 Valid Adult Upgrade to Gold Plan
    const goldUpgradeRes = await request(`/api/members/${adultMemberId}/memberships`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        planId: 'gold',
        billingCycle: 'annual'
      }
    });
    assert(goldUpgradeRes.status === 201, 'POST /api/members/:id/memberships upgraded adult member to Gold plan (HTTP 201)');
    assert(goldUpgradeRes.body.data.plan.tier === 'Gold', 'Plan tier is Gold');
    assert(goldUpgradeRes.body.data.plan.shopDiscountPct === 20, 'Backend applied 20% pro shop discount');
    assert(goldUpgradeRes.body.data.plan.courtDiscountPct === 100, 'Backend applied 100% complimentary court discount');

    // 4.7 Retrieve Member Memberships History
    const historyRes = await request(`/api/members/${adultMemberId}/memberships`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(historyRes.status === 200, 'GET /api/members/:id/memberships returned HTTP 200');
    assert(historyRes.body.data.length >= 2, 'History contains both initial Silver and new Gold membership');
    assert(historyRes.body.data[0].plan_tier === 'Gold' && historyRes.body.data[0].status === 'active', 'Latest membership is active Gold');
    assert(historyRes.body.data.some(m => m.status === 'expired'), 'Previous membership transitioned to expired state');

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${passedCount} passed, ${failedCount} failed.`);
    console.log('===============================================================\n');

    server.close();
    await pool.end();
  } catch (err) {
    console.error('\n❌ FATAL TEST SUITE ERROR:', err);
    if (server) server.close();
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  runAuthMemberMembershipTests();
}

module.exports = { runAuthMemberMembershipTests };
