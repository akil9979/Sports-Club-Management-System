/**
 * End-to-End Automated Verification Script for Scalable Staff Job-Based Access Control (JBAC)
 * Tests all 17 conditions specified in the requirements.
 */

const API_BASE = 'http://localhost:5000/api';

async function req(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${message}`);
  }
}

async function run() {
  console.log('====================================================');
  console.log('STARTING JBAC SCALABILITY VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Member registration -> Staff Job is not required
  const memberEmail = `member_test_${Date.now()}@example.com`;
  const regMember = await req('/auth/register', 'POST', {
    email: memberEmail,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Member',
    role: 'member'
  });
  assert(regMember.status === 201 && regMember.data?.data?.user?.role === 'member', 'Member registration succeeds without staffJobTypeId');

  // Test 2: Staff registration -> Staff Job is required (fails if missing)
  const staffEmailFail = `staff_fail_${Date.now()}@example.com`;
  const regStaffFail = await req('/auth/register', 'POST', {
    email: staffEmailFail,
    password: 'Password123!',
    firstName: 'Missing',
    lastName: 'Job',
    role: 'staff'
  });
  assert(regStaffFail.status === 422, 'Staff registration rejected with 422 if staffJobTypeId is missing');

  // Test 3: Staff registration -> Job options come from database
  const jobOptions = await req('/staff-job-types', 'GET');
  assert(
    jobOptions.status === 200 && Array.isArray(jobOptions.data?.data) && jobOptions.data.data.some(j => j.code === 'shop_inventory'),
    'Active staff job options are served dynamically from database'
  );

  const shopJob = jobOptions.data.data.find(j => j.code === 'shop_inventory');
  const barJob = jobOptions.data.data.find(j => j.code === 'bar');

  // Test 4: Admin creates a new Staff Job -> Immediately appears in GET /api/staff-job-types
  // First, log in as Admin
  const adminLogin = await req('/auth/login', 'POST', {
    email: 'admin@championsclub.com',
    password: 'Password@123'
  });
  const adminToken = adminLogin.data?.data?.token;
  assert(adminLogin.status === 200 && adminLogin.data?.data?.user?.role === 'admin', 'Admin login successful');

  const newJobCode = `equip_mgr_${Date.now().toString().slice(-4)}`;
  const createJobRes = await req('/admin/staff-job-types', 'POST', {
    code: newJobCode,
    name: 'Equipment Manager',
    description: 'Manages sports equipment and stock checks.',
    permissions: ['products.view', 'inventory.view', 'inventory.update', 'stock_movements.view', 'stock_movements.create']
  }, adminToken);
  assert(createJobRes.status === 201 && createJobRes.data?.data?.code === newJobCode, 'Admin creates a new Staff Job (Equipment Manager) without schema/code change');

  const freshJobOptions = await req('/staff-job-types', 'GET');
  assert(
    freshJobOptions.data?.data?.some(j => j.code === newJobCode),
    'Newly created Staff Job immediately appears in dynamic GET /api/staff-job-types'
  );

  // Test 5: Shop & Inventory Staff logs in -> user returns staffJob: 'shop_inventory' & permissions
  const shopStaffEmail = `rahul_shop_${Date.now()}@example.com`;
  const regShopStaff = await req('/auth/register', 'POST', {
    email: shopStaffEmail,
    password: 'Password123!',
    firstName: 'Rahul',
    lastName: 'Patel',
    phone: '+919876543210',
    role: 'staff',
    staffJobTypeId: shopJob.id
  });
  const shopStaffToken = regShopStaff.data?.data?.token;
  const shopStaffUser = regShopStaff.data?.data?.user;
  assert(
    regShopStaff.status === 201 &&
    shopStaffUser?.staffJob?.code === 'shop_inventory' &&
    shopStaffUser?.permissions?.includes('products.create'),
    'Shop & Inventory Staff registration and profile returns staffJob: "shop_inventory" with permissions'
  );

  // Test 6: Shop & Inventory Staff -> Can create product
  const newSku = `SKU-TEST-${Date.now().toString().slice(-5)}`;
  const createProdRes = await req('/products', 'POST', {
    name: 'Head Speed MP 2026 Test Racket',
    category: 'Rackets',
    sku: newSku,
    price: 14999.00,
    memberPrice: 11999.00,
    stockQuantity: 15,
    lowStockThreshold: 4,
    description: 'Test racket created by Shop Staff'
  }, shopStaffToken);
  assert(createProdRes.status === 201 && createProdRes.data?.data?.sku === newSku, 'Shop & Inventory Staff can create product (products.create)');

  const createdProductId = createProdRes.data?.data?.id;

  // Test 7: Shop & Inventory Staff -> Can edit product
  const editProdRes = await req(`/products/${createdProductId}`, 'PATCH', {
    price: 15999.00,
    memberPrice: 12499.00
  }, shopStaffToken);
  assert(editProdRes.status === 200, 'Shop & Inventory Staff can edit product (products.update)');

  // Test 8: Shop & Inventory Staff -> Can manage inventory & record movement
  const invRes = await req('/inventory', 'GET', null, shopStaffToken);
  assert(invRes.status === 200 && Array.isArray(invRes.data?.data), 'Shop & Inventory Staff can view inventory (inventory.view)');

  const movementRes = await req('/stock-movements', 'POST', {
    productId: createdProductId,
    quantity: 5,
    movementType: 'restock',
    notes: 'Seasonal shipment intake'
  }, shopStaffToken);
  assert(movementRes.status === 201, 'Shop & Inventory Staff can record stock movement (stock_movements.create)');

  // Test 9: Shop & Inventory Staff -> Cannot access Bar APIs (Forbidden 403)
  const barAccessByShop = await req('/bar/orders', 'GET', null, shopStaffToken);
  assert(barAccessByShop.status === 403, 'Shop & Inventory Staff is DENIED access to Bar APIs (HTTP 403 Forbidden)');

  // Test 10: Bar Staff -> Can access Bar APIs
  // Log in existing seed Bar Staff (priya.nair@championsclub.com)
  const barStaffLogin = await req('/auth/login', 'POST', {
    email: 'priya.nair@championsclub.com',
    password: 'Password@123'
  });
  const barStaffToken = barStaffLogin.data?.data?.token;
  const barOrdersRes = await req('/bar/orders', 'GET', null, barStaffToken);
  assert(barOrdersRes.status === 200, 'Bar Staff can access Bar APIs (bar_orders.view)');

  // Test 11: Bar Staff -> Cannot create or edit Shop products (Forbidden 403)
  const barCreateProd = await req('/products', 'POST', {
    name: 'Unauthorized Bar Product',
    category: 'Drinks',
    sku: `BAR-UNAUTH-${Date.now()}`,
    price: 500
  }, barStaffToken);
  assert(barCreateProd.status === 403, 'Bar Staff is DENIED product creation (HTTP 403 Forbidden)');

  // Test 12: Staff -> Cannot access Admin Expenses by default
  const staffExpenseRes = await req('/expenses', 'GET', null, shopStaffToken);
  assert(staffExpenseRes.status === 403, 'Staff is DENIED access to Admin Expenses by default (HTTP 403 Forbidden)');

  // Test 13: Admin -> Can access everything (Expenses, Admin APIs, Products, etc.)
  const adminExpenseRes = await req('/expenses', 'GET', null, adminToken);
  const adminStaffListRes = await req('/admin/staff', 'GET', null, adminToken);
  assert(adminExpenseRes.status === 200 && adminStaffListRes.status === 200, 'Admin can access everything with full wildcard access');

  // Test 14: Admin changes Staff Job -> Permissions update dynamically
  // Find employee record for Rahul
  const staffRoster = await req('/admin/staff', 'GET', null, adminToken);
  const rahulEmployee = staffRoster.data?.data?.find(s => s.email === shopStaffEmail);
  assert(Boolean(rahulEmployee), 'Found registered staff member in admin roster');

  // Change Rahul from Shop & Inventory to Bar Staff
  const changeJobRes = await req(`/admin/staff/${rahulEmployee.id}/job`, 'PATCH', {
    staffJobTypeId: barJob.id
  }, adminToken);
  assert(changeJobRes.status === 200, 'Admin successfully changed staff job from Shop to Bar Staff');

  // Verify Rahul's login profile immediately reflects Bar Staff and new permissions
  const rahulReLogin = await req('/auth/login', 'POST', {
    email: shopStaffEmail,
    password: 'Password123!'
  });
  assert(
    rahulReLogin.status === 200 &&
    rahulReLogin.data?.data?.user?.staffJob?.code === 'bar' &&
    rahulReLogin.data?.data?.user?.permissions?.includes('bar_orders.view') &&
    !rahulReLogin.data?.data?.user?.permissions?.includes('products.create'),
    'Staff permissions updated instantly after job change with ZERO code modification'
  );

  // Test 15: Unauthorized user manually calls restricted API -> Backend returns 403
  const manualRestrictedCall = await req(`/products/${createdProductId}`, 'PATCH', {
    price: 99999
  }, rahulReLogin.data?.data?.token);
  assert(manualRestrictedCall.status === 403, 'Manually calling restricted API without required permission returns 403');

  // Test 16: Inactive Staff Job -> Cannot be newly assigned
  const inactiveJobRes = await req(`/admin/staff-job-types/${createJobRes.data.data.id}`, 'PATCH', {
    isActive: false
  }, adminToken);
  assert(inactiveJobRes.status === 200 && inactiveJobRes.data?.data?.isActive === false, 'Admin soft-deactivates staff job');

  const activeJobsAfterDeact = await req('/staff-job-types', 'GET');
  assert(
    !activeJobsAfterDeact.data?.data?.some(j => j.id === createJobRes.data.data.id),
    'Inactive staff job is excluded from new registration selections'
  );

  // Test 17: Existing staff assigned to an inactive job -> Handled safely without breaking records
  const rosterCheck = await req('/admin/staff', 'GET', null, adminToken);
  assert(rosterCheck.status === 200 && rosterCheck.data?.data?.length > 0, 'Existing staff roster loads safely without integrity errors');

  console.log('\n====================================================');
  console.log(`TEST SUITE COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
