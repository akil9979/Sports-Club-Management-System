/**
 * Champions Club - Frontdesk QR Verification Test Suite
 */

const assert = require('assert');
const memberService = require('../src/modules/members/memberService');

async function runTests() {
  console.log('--- TESTING FRONTDESK QR VERIFICATION & PASS GENERATION ---');

  // Test 1: Generate QR pass for Devon Conway (MEM-8801 - Gold)
  const devonPass = await memberService.getMemberQrPass('MEM-8801');
  assert(devonPass, 'Expected devonPass to be generated');
  assert(devonPass.pass, 'Expected pass payload in devonPass');
  assert.equal(devonPass.pass.member.name, 'Devon Conway');
  assert.equal(devonPass.pass.membership.tier, 'Gold');
  assert.equal(devonPass.pass.member.id, 'MEM-8801');
  assert(devonPass.pass.security.signature, 'Expected cryptographic security signature');
  console.log('✅ Pass 1: Generated valid QR pass for Gold Member (Devon Conway)');

  // Test 2: Verify QR pass via payload
  const verification = await memberService.verifyMemberQr({
    qrPayload: devonPass.qrRaw
  });
  assert.equal(verification.valid, true);
  assert.equal(verification.member.id, 'MEM-8801');
  assert.equal(verification.membership.tier, 'Gold');
  console.log('✅ Pass 2: Verified member successfully using QR raw payload');

  // Test 3: Log frontdesk check-in
  const checkIn = await memberService.logFrontdeskCheckIn({
    memberId: 'MEM-8801',
    facility: 'Tennis Court 1',
    staffName: 'Aditi Frontdesk',
    notes: 'Morning singles practice'
  });
  assert.equal(checkIn.success, true);
  assert.equal(checkIn.checkIn.facility, 'Tennis Court 1');
  assert.equal(checkIn.checkIn.memberName, 'Devon Conway');
  console.log('✅ Pass 3: Frontdesk check-in logged successfully');

  // Test 4: Retrieve check-ins
  const checkIns = await memberService.getFrontdeskCheckIns();
  assert(checkIns.logs.length > 0);
  assert.equal(checkIns.stats.totalScans >= 1, true);
  console.log('✅ Pass 4: Retrieved frontdesk check-ins and statistics');

  console.log('\nALL QR VERIFICATION BACKEND TESTS PASSED!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
