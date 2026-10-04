/**
 * Champions Club - CRM & Staff Operations Automated Integration Tests
 * Role: MEMBER 4 (Backend Operations Developer)
 *
 * Verifies:
 * - Public lead creation & validation (POST /api/leads)
 * - Duplicate enquiry rejection (409)
 * - Staff authentication & lead retrieval (GET /api/leads, GET /api/leads/:id)
 * - Enquiry follow-up logging & auto-transition to 'contacted' (POST/GET /api/leads/:id/followups)
 * - Quotation generation & positive amount validation (POST /api/leads/:id/quotations)
 * - Trial booking with court overlap protection (POST /api/leads/:id/trials)
 * - Employee listing, registration, update, duplicate email prevention (GET/POST/PATCH /api/employees)
 * - Shift scheduling and time validation (GET/POST /api/shifts)
 * - Leave request submission, date validation, overlap prevention (POST/GET /api/leave-requests)
 * - Leave approval/rejection with strict role protection (PATCH /api/leave-requests/:id/approve|reject)
 * - Unauthorized access rejection (401 / 403)
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

async function loginUser(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  const token = res.body?.data?.token || res.body?.token;
  if (res.status !== 200 || !token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return token;
}

async function runOperationsSuite() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - CRM & STAFF OPERATIONS INTEGRATION TEST SUITE');
  console.log('Role: MEMBER 4 (Backend Operations Developer)');
  console.log('===============================================================\n');

  try {
    // 1. Reset and reseed database
    console.log('🔄 Initializing clean database environment...');
    await initSchema();
    await seedDatabase();
    console.log('✅ Database schema and seed data loaded.\n');

    // 2. Start HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`🚀 Test server listening on ${baseUrl}\n`);
        resolve();
      });
    });

    // 3. Obtain authentication tokens
    console.log('--- Step 1: Authentication & Role Tokens ---');
    const adminToken = await loginUser('admin@championsclub.com', 'Password@123');
    assert(adminToken, 'Admin token acquired');

    const staffToken = await loginUser('arjun.singh@championsclub.com', 'Password@123');
    assert(staffToken, 'Staff token acquired');

    // 4. Public Lead Creation
    console.log('\n--- Step 2: Public Lead Creation (POST /api/leads) ---');
    const invalidLeadRes = await request('/api/leads', {
      method: 'POST',
      body: { name: '', email: 'not-an-email' }
    });
    assert(invalidLeadRes.status === 422, 'Invalid lead payload returns 422 Unprocessable Entity');
    assert(invalidLeadRes.body.errors && invalidLeadRes.body.errors.length > 0, 'Validation errors array returned');

    const validLeadRes = await request('/api/leads', {
      method: 'POST',
      body: {
        name: 'Siddharth Varma',
        email: 'siddharth.varma@example.com',
        phone: '+919988776655',
        sport: 'Tennis',
        interestTier: 'Gold',
        message: 'Interested in club trial and evening tennis slots.'
      }
    });
    assert(validLeadRes.status === 201, 'Public enquiry creation returns 201 Created');
    assert(validLeadRes.body.data && validLeadRes.body.data.id, 'Enquiry ID assigned to lead');
    assert(validLeadRes.body.data.status === 'new', 'Initial lead status is "new"');
    const newLeadId = validLeadRes.body.data.id;

    // Duplicate enquiry prevention
    const duplicateLeadRes = await request('/api/leads', {
      method: 'POST',
      body: {
        name: 'Siddharth Varma',
        email: 'siddharth.varma@example.com',
        phone: '+919988776655',
        sport: 'Tennis'
      }
    });
    assert(duplicateLeadRes.status === 409, 'Duplicate pending enquiry returns 409 Conflict');
    assert(duplicateLeadRes.body.code === 'DUPLICATE_ENQUIRY', 'Duplicate error code is DUPLICATE_ENQUIRY');

    // 5. Protected Staff Lead Retrieval
    console.log('\n--- Step 3: Staff Lead Retrieval (GET /api/leads) ---');
    const unauthLeadListRes = await request('/api/leads');
    assert(unauthLeadListRes.status === 401, 'Unauthenticated lead list request rejected with 401 Unauthorized');

    const staffLeadListRes = await request('/api/leads', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffLeadListRes.status === 200, 'Staff retrieval of leads returns 200 OK');
    assert(Array.isArray(staffLeadListRes.body.data), 'Leads returned as data array');
    const foundNewLead = staffLeadListRes.body.data.find(l => l.id === newLeadId);
    assert(foundNewLead && foundNewLead.name === 'Siddharth Varma', 'Newly created lead visible in staff list');

    // Filter by status
    const newStatusListRes = await request('/api/leads?status=new', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(newStatusListRes.status === 200, 'Filtering leads by status returns 200');
    assert(newStatusListRes.body.data.every(l => l.status === 'new'), 'All filtered leads have status "new"');

    // Get lead by ID
    const leadDetailRes = await request(`/api/leads/${newLeadId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(leadDetailRes.status === 200, 'Staff GET /api/leads/:id returns 200 OK');
    assert(Array.isArray(leadDetailRes.body.data.followups), 'Lead details include followups array');
    assert(Array.isArray(leadDetailRes.body.data.quotations), 'Lead details include quotations array');
    assert(Array.isArray(leadDetailRes.body.data.trials), 'Lead details include trials array');

    // Lead not found
    const notFoundLeadRes = await request('/api/leads/LEAD-NONEXISTENT', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(notFoundLeadRes.status === 404, 'Non-existent lead returns 404 Not Found');

    // Update lead
    const updateLeadRes = await request(`/api/leads/${newLeadId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: { message: 'Updated note: prefers weekday morning coaching' }
    });
    assert(updateLeadRes.status === 200, 'Staff PATCH /api/leads/:id returns 200 OK');
    assert(updateLeadRes.body.data.message.includes('prefers weekday morning coaching'), 'Lead note updated');

    // 6. Follow-up Operations
    console.log('\n--- Step 4: Lead Follow-up Operations (POST/GET /api/leads/:id/followups) ---');
    const followupRes = await request(`/api/leads/${newLeadId}/followups`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        note: 'Spoke with Siddharth over phone, explained Gold membership court benefits.',
        contactMethod: 'phone',
        outcome: 'Interested in booking a weekend trial session',
        nextActionDate: '2026-10-10'
      }
    });
    assert(followupRes.status === 201, 'Staff follow-up creation returns 201 Created');
    assert(followupRes.body.data.summary.includes('Gold membership'), 'Follow-up summary stored');

    // Check automatic lead transition to 'contacted'
    const leadAfterFollowup = await request(`/api/leads/${newLeadId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(leadAfterFollowup.body.data.status === 'contacted', 'Lead status auto-transitioned from "new" to "contacted"');

    // List follow-ups
    const listFollowupsRes = await request(`/api/leads/${newLeadId}/followups`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(listFollowupsRes.status === 200, 'GET /api/leads/:id/followups returns 200 OK');
    assert(listFollowupsRes.body.data.length >= 1, 'Follow-up retrieved in history');

    // 7. Quotation Operations
    console.log('\n--- Step 5: Quotation Generation (POST /api/leads/:id/quotations) ---');
    // Negative quotation amount validation
    const invalidQuoteRes = await request(`/api/leads/${newLeadId}/quotations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Gold Membership Annual Quote',
        amount: -100,
        validUntil: '2026-11-01'
      }
    });
    assert(invalidQuoteRes.status === 422, 'Negative quotation amount returns 422 Unprocessable Entity');

    // Valid quotation
    const validQuoteRes = await request(`/api/leads/${newLeadId}/quotations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        title: 'Gold Championship Annual Package',
        planId: 'gold',
        amount: 47990.00,
        discountAmount: 2000.00,
        validUntil: '2026-11-30',
        terms: 'Includes complimentary court reservation and welcome kit.'
      }
    });
    assert(validQuoteRes.status === 201, 'Quotation generation returns 201 Created');
    assert(validQuoteRes.body.data.quotationNumber.startsWith('QT-'), 'Quotation assigned unique QT number');
    assert(validQuoteRes.body.data.amount === 47990, 'Quotation positive amount stored');

    // Check auto-transition to 'quoted'
    const leadAfterQuote = await request(`/api/leads/${newLeadId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(leadAfterQuote.body.data.status === 'quoted', 'Lead status auto-transitioned to "quoted"');

    // 8. Trial Booking & Conflict Protection
    console.log('\n--- Step 6: Trial Session Booking & Conflict Edge Cases (POST /api/leads/:id/trials) ---');
    // Book trial for Siddharth on court-2 (open court)
    const validTrialRes = await request(`/api/leads/${newLeadId}/trials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        courtId: 'court-2',
        scheduledTime: '2026-10-15T10:00:00.000Z',
        durationMinutes: 60,
        feedback: 'First time player on Champions Club indoor court'
      }
    });
    assert(validTrialRes.status === 201, 'Trial booking created with 201 Created');
    assert(validTrialRes.body.data.status === 'scheduled', 'Trial session scheduled');

    // Check auto-transition to 'trial_booked'
    const leadAfterTrial = await request(`/api/leads/${newLeadId}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(leadAfterTrial.body.data.status === 'trial_booked', 'Lead status auto-transitioned to "trial_booked"');

    // Slot Conflict: Try to book a conflicting trial on same court-2 at overlapping time
    const conflictingTrialRes = await request(`/api/leads/LEAD-102/trials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        courtId: 'court-2',
        scheduledTime: '2026-10-15T10:30:00.000Z', // 30-min overlap!
        durationMinutes: 60
      }
    });
    assert(conflictingTrialRes.status === 409, 'Conflicting trial booking returns 409 Conflict');
    assert(conflictingTrialRes.body.code === 'COURT_SLOT_UNAVAILABLE', 'Conflict code is COURT_SLOT_UNAVAILABLE');

    // Conflict against seeded ordinary booking on court-1
    // Seeded booking on court-1: today at 07:00:00 UTC to 08:00:00 UTC
    const todayStr = new Date().toISOString().split('T')[0];
    const conflictBookingTrialRes = await request(`/api/leads/LEAD-102/trials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        courtId: 'court-1',
        scheduledTime: `${todayStr}T07:00:00.000Z`,
        durationMinutes: 60
      }
    });
    assert(conflictBookingTrialRes.status === 409, 'Trial conflicting with ordinary booking returns 409 Conflict');

    // 9. Employee Operations
    console.log('\n--- Step 7: Employee Operations (GET/POST/PATCH /api/employees) ---');
    // Staff can list employees
    const staffEmpListRes = await request('/api/employees', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffEmpListRes.status === 200, 'Staff GET /api/employees returns 200 OK');
    assert(Array.isArray(staffEmpListRes.body), 'Employees returned as array');

    // Staff role forbidden from creating new employees
    const staffCreateEmpRes = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        firstName: 'Unauthorized',
        lastName: 'Creation',
        email: 'unauth.emp@championsclub.com',
        phone: '+919988771122',
        department: 'bar',
        designation: 'Staff'
      }
    });
    assert(staffCreateEmpRes.status === 403, 'Staff role creating employee rejected with 403 Forbidden');

    // Admin can create new employee
    const adminCreateEmpRes = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        firstName: 'Vikram',
        lastName: 'Malhotra',
        email: 'vikram.malhotra@championsclub.com',
        phone: '+919876543209',
        department: 'sports_academy',
        designation: 'Senior Tennis Coach',
        hourlyRate: 350.00,
        salary: 55000.00,
        employmentType: 'full_time'
      }
    });
    assert(adminCreateEmpRes.status === 201, 'Admin POST /api/employees returns 201 Created');
    assert(adminCreateEmpRes.body.data && adminCreateEmpRes.body.data.id, 'New employee ID generated');
    const newEmpId = adminCreateEmpRes.body.data.id;

    // Duplicate email rejection
    const dupEmpRes = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        firstName: 'Duplicate',
        lastName: 'Vikram',
        email: 'vikram.malhotra@championsclub.com',
        phone: '+919876543299',
        department: 'sports_academy',
        designation: 'Coach'
      }
    });
    assert(dupEmpRes.status === 409, 'Duplicate employee email returns 409 Conflict');

    // Admin updates employee
    const updateEmpRes = await request(`/api/employees/${newEmpId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { designation: 'Head Tennis Coach & Academy Lead' }
    });
    assert(updateEmpRes.status === 200, 'Admin PATCH /api/employees/:id returns 200 OK');
    assert(updateEmpRes.body.data.designation === 'Head Tennis Coach & Academy Lead', 'Designation successfully updated');

    // 10. Shift Operations
    console.log('\n--- Step 8: Shift Scheduling (GET/POST /api/shifts) ---');
    const shiftsListRes = await request(`/api/shifts?date=${todayStr}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(shiftsListRes.status === 200, 'GET /api/shifts returns 200 OK');
    assert(Array.isArray(shiftsListRes.body), 'Shifts returned as array');

    // Staff cannot schedule shift
    const staffShiftRes = await request('/api/shifts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        employeeId: newEmpId,
        shiftDate: todayStr,
        startTime: `${todayStr}T09:00:00.000Z`,
        endTime: `${todayStr}T17:00:00.000Z`
      }
    });
    assert(staffShiftRes.status === 403, 'Staff role scheduling shift rejected with 403 Forbidden');

    // Invalid shift times: end_time <= start_time
    const invalidShiftRes = await request('/api/shifts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        employeeId: newEmpId,
        shiftDate: todayStr,
        startTime: `${todayStr}T18:00:00.000Z`,
        endTime: `${todayStr}T16:00:00.000Z` // end before start!
      }
    });
    assert(invalidShiftRes.status === 400, 'Invalid shift times (end <= start) rejected with 400 Bad Request');

    // Admin creates valid shift
    const validShiftRes = await request('/api/shifts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        employeeId: newEmpId,
        shiftDate: todayStr,
        startTime: `${todayStr}T09:00:00.000Z`,
        endTime: `${todayStr}T17:00:00.000Z`,
        notes: 'Morning junior clinic & afternoon member drills'
      }
    });
    assert(validShiftRes.status === 201, 'Admin POST /api/shifts returns 201 Created');
    assert(validShiftRes.body.data.status === 'scheduled', 'Shift status is scheduled');

    // 11. Leave Request Operations & Edge Cases
    console.log('\n--- Step 9: Leave Request Submission & Overlap Protection (POST/GET /api/leave-requests) ---');
    // Invalid dates: end < start
    const invalidLeaveRes = await request('/api/leave-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        employeeId: 'STF-001',
        leaveType: 'annual',
        startDate: '2026-11-15',
        endDate: '2026-11-10', // end < start!
        reason: 'Holiday vacation'
      }
    });
    assert(invalidLeaveRes.status === 400, 'Invalid leave dates (end < start) returns 400 Bad Request');

    // Valid leave submission
    const validLeaveRes = await request('/api/leave-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        employeeId: 'STF-001',
        leaveType: 'annual',
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        reason: 'Annual family holiday'
      }
    });
    assert(validLeaveRes.status === 201, 'Leave submission returns 201 Created');
    assert(validLeaveRes.body.data.status === 'pending', 'Submitted leave status is pending');
    const leaveId = validLeaveRes.body.data.id;

    // Overlapping leave submission for same employee
    const overlapLeaveRes = await request('/api/leave-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        employeeId: 'STF-001',
        leaveType: 'casual',
        startDate: '2026-11-12', // Overlaps 2026-11-10 to 2026-11-15!
        endDate: '2026-11-18',
        reason: 'Personal errands'
      }
    });
    assert(overlapLeaveRes.status === 409, 'Overlapping leave request returns 409 Conflict');
    assert(overlapLeaveRes.body.code === 'LEAVE_OVERLAP', 'Overlap error code is LEAVE_OVERLAP');

    // List leave requests
    const listLeavesRes = await request('/api/leave-requests', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(listLeavesRes.status === 200, 'GET /api/leave-requests returns 200 OK');
    assert(Array.isArray(listLeavesRes.body), 'Leave requests returned as array');

    // 12. Leave Approval / Rejection (Role-Protected)
    console.log('\n--- Step 10: Role-Protected Leave Approval & Invalid Transitions ---');
    // Staff role unauthorized to approve
    const staffApproveRes = await request(`/api/leave-requests/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffApproveRes.status === 403, 'Staff role unauthorized approval returns 403 Forbidden');

    // Staff role unauthorized to reject
    const staffRejectRes = await request(`/api/leave-requests/${leaveId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffRejectRes.status === 403, 'Staff role unauthorized rejection returns 403 Forbidden');

    // Admin approves leave request
    const adminApproveRes = await request(`/api/leave-requests/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminApproveRes.status === 200, 'Admin approval returns 200 OK');
    assert(adminApproveRes.body.data.status === 'approved', 'Leave request status is now "approved"');
    assert(adminApproveRes.body.data.approvedBy !== null, 'Approver ID recorded');

    // Verify employee status updated to 'on_leave'
    const empCheckRes = await query('SELECT status FROM employees WHERE id = $1', ['STF-001']);
    assert(empCheckRes.rows[0].status === 'on_leave', 'Employee status updated to "on_leave"');

    // Already-approved leave: Attempting to approve again
    const reApproveRes = await request(`/api/leave-requests/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reApproveRes.status === 400, 'Re-approving already-approved leave returns 400 Bad Request');
    assert(reApproveRes.body.code === 'ALREADY_APPROVED', 'Error code is ALREADY_APPROVED');

    // Already-approved leave: Attempting to reject
    const rejectApprovedRes = await request(`/api/leave-requests/${leaveId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(rejectApprovedRes.status === 400, 'Rejecting already-approved leave returns 400 Bad Request');
    assert(rejectApprovedRes.body.code === 'INVALID_LEAVE_STATUS_TRANSITION', 'Error code is INVALID_LEAVE_STATUS_TRANSITION');

    // Rejection flow on fresh leave request
    const secondLeaveRes = await request('/api/leave-requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: {
        employeeId: 'STF-002',
        leaveType: 'casual',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        reason: 'Personal appointment'
      }
    });
    assert(secondLeaveRes.status === 201, 'Second leave request created');
    const secondLeaveId = secondLeaveRes.body.data.id;

    const adminRejectRes = await request(`/api/leave-requests/${secondLeaveId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminRejectRes.status === 200, 'Admin rejection returns 200 OK');
    assert(adminRejectRes.body.data.status === 'rejected', 'Leave status is "rejected"');

    // Already-rejected leave: Attempting to reject again
    const reRejectRes = await request(`/api/leave-requests/${secondLeaveId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reRejectRes.status === 400, 'Re-rejecting already-rejected leave returns 400 Bad Request');
    assert(reRejectRes.body.code === 'ALREADY_REJECTED', 'Error code is ALREADY_REJECTED');

    // Non-existent or non-UUID leave ID returns 404
    const notFoundLeaveRes = await request('/api/leave-requests/not-a-uuid/approve', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(notFoundLeaveRes.status === 404, 'Invalid/non-existent leave ID returns 404 Not Found');

    console.log('\n===============================================================');
    console.log(`OPERATIONS INTEGRATION SUITE COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n💥 TEST EXECUTION ABORTED DUE TO UNCAUGHT ERROR:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await pool.end();
  }
}

if (require.main === module) {
  runOperationsSuite();
}

module.exports = { runOperationsSuite };
