/**
 * Champions Club - Bar Operations & POS Test Suite
 * Role: MEMBER 4 (Backend Operations)
 * 
 * Tests:
 * 1. Bar tables retrieval & active tab overlay (GET /api/bar/tables)
 * 2. Bar menu items & category filtering (GET /api/bar/menu)
 * 3. Guest bar order / tab creation with 0% discount & 5% tax
 * 4. Member bar order with Gold tier (15% membership discount)
 * 5. Member bar order with Silver tier (10% membership discount)
 * 6. Adding items to an active open tab (POST /api/bar/orders/:id/items)
 * 7. Updating item quantity & notes on open tab (PATCH /api/bar/orders/:id/items/:itemId)
 * 8. Kitchen progression workflow (PATCH /api/bar/orders/:id/status) PENDING -> PREPARING -> READY -> SERVED
 * 9. Cash settlement (POST /api/bar/orders/:id/settle) with payment table record & table clearance
 * 10. Card settlement with receipt number generation
 * 11. UPI settlement with transaction reference
 * 12. Duplicate settlement protection (rejects settling an already settled order)
 * 13. Validation & error edge cases:
 *     - Rejection of invalid non-positive quantities
 *     - Rejection of unknown menu items
 *     - Rejection of unknown tables
 *     - Prevention of conflicting open tabs on the same table
 *     - Prevention of adding items to settled orders
 *     - Rejection of missing payment method or insufficient settlement amount
 */

const http = require('http');
const app = require('../src/app');
const { initSchema } = require('../src/db/init');
const { seedDatabase } = require('../src/db/seed');
const { pool, query } = require('../src/config/database');

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

async function runBarTests() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - BAR POS, TABS & SETTLEMENT TEST SUITE');
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
    // TEST 1: GET /api/bar/tables
    // ------------------------------------------------------------------------
    console.log('[TEST 1] Tables Retrieval & Dynamic Tab Status');
    const tablesRes = await request('/api/bar/tables');
    assert(tablesRes.status === 200, 'GET /api/bar/tables returned HTTP 200');
    assert(Array.isArray(tablesRes.body) && tablesRes.body.length >= 8, 'Found at least 8 bar tables');
    
    const table1 = tablesRes.body.find(t => t.id === 'table-1');
    assert(table1 !== undefined, 'Table 1 exists');
    assert(table1.status === 'occupied' || table1.status === 'open', 'Table 1 reflects open order status');
    assert(table1.currentOrderId === 'ORD-201', 'Table 1 is mapped to current active order ORD-201');
    assert(typeof table1.activeTabTotal === 'number' && table1.activeTabTotal > 0, 'Table 1 has active tab total');

    // ------------------------------------------------------------------------
    // TEST 2: GET /api/bar/menu & CATEGORY FILTERING
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Menu Items & Category Filter');
    const menuRes = await request('/api/bar/menu');
    assert(menuRes.status === 200, 'GET /api/bar/menu returned HTTP 200');
    assert(Array.isArray(menuRes.body) && menuRes.body.length >= 10, 'Returned full bar menu');

    const sampleItem = menuRes.body[0];
    assert(sampleItem.id && sampleItem.name && typeof sampleItem.price === 'number', 'Menu item has canonical schema');

    const bitesRes = await request('/api/bar/menu?category=Bar Bites');
    assert(bitesRes.status === 200, 'GET /api/bar/menu?category=Bar Bites returned HTTP 200');
    assert(bitesRes.body.length > 0, 'Returned Bar Bites items');
    bitesRes.body.forEach(item => {
      assert(item.category.toLowerCase() === 'bar bites', 'Filtered item belongs to Bar Bites category');
    });

    // ------------------------------------------------------------------------
    // TEST 3: GUEST BAR ORDER CREATION (0% DISCOUNT, 5% TAX)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Guest Bar Order Creation');
    const guestOrderPayload = {
      tableId: 'table-2',
      guestName: 'Walk-in Guest Bob',
      items: [
        { itemId: 'bev-1', quantity: 2 }, // 380 * 2 = 760
        { itemId: 'food-1', quantity: 1 }  // 340 * 1 = 340 -> Subtotal: 1100
      ]
    };
    const guestOrderRes = await request('/api/bar/orders', {
      method: 'POST',
      body: guestOrderPayload
    });
    assert(guestOrderRes.status === 201, 'POST /api/bar/orders returned HTTP 201');
    const guestOrder = guestOrderRes.body.order || guestOrderRes.body;
    assert(guestOrder.subtotal === 1100.00, 'Guest order subtotal is 1100.00');
    assert(guestOrder.discountPercentage === 0, 'Guest order discount percentage is 0%');
    assert(guestOrder.discountAmount === 0, 'Guest order discount amount is 0.00');
    assert(guestOrder.tax === 55.00, 'Guest order 5% tax is 55.00 (1100 * 0.05)');
    assert(guestOrder.total === 1155.00, 'Guest order total is 1155.00 (1100 + 55)');
    assert(guestOrder.status === 'open', 'Order status is open');
    assert(guestOrder.kitchenStatus === 'PENDING', 'Initial kitchen status is PENDING');

    // ------------------------------------------------------------------------
    // TEST 4: MEMBER ORDER CREATION WITH GOLD MEMBERSHIP (15% DISCOUNT)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 4] Member Order Creation with Gold 15% Discount');
    const goldOrderPayload = {
      tableId: 'table-6',
      memberId: 'MEM-8801', // Devon Conway (Gold tier)
      items: [
        { itemId: 'bev-4', quantity: 2 }, // 520 * 2 = 1040
        { itemId: 'main-1', quantity: 1 }  // 580 * 1 = 580 -> Subtotal: 1620
      ]
    };
    const goldOrderRes = await request('/api/bar/orders', {
      method: 'POST',
      body: goldOrderPayload
    });
    assert(goldOrderRes.status === 201, 'POST /api/bar/orders for Gold member returned HTTP 201');
    const goldOrder = goldOrderRes.body.order || goldOrderRes.body;
    assert(goldOrder.subtotal === 1620.00, 'Gold order subtotal is 1620.00');
    assert(goldOrder.discountPercentage === 15.00, 'Gold member receives 15% bar discount');
    assert(goldOrder.discountAmount === 243.00, 'Gold discount amount is 243.00 (1620 * 0.15)');
    // Discounted subtotal = 1620 - 243 = 1377.00. Tax = 1377 * 0.05 = 68.85. Total = 1377 + 68.85 = 1445.85
    assert(goldOrder.tax === 68.85, 'Tax calculated on discounted subtotal is 68.85');
    assert(goldOrder.total === 1445.85, 'Total calculated is 1445.85');
    assert(goldOrder.membershipTier === 'Gold', 'Membership tier identified as Gold');

    // ------------------------------------------------------------------------
    // TEST 5: MEMBER ORDER CREATION WITH SILVER MEMBERSHIP (10% DISCOUNT)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 5] Member Order Creation with Silver 10% Discount');
    const silverOrderPayload = {
      tableId: 'table-8',
      memberId: 'MEM-4920', // Sarah Jenkins (Silver tier)
      items: [
        { itemId: 'food-2', quantity: 2 } // 460 * 2 = 920
      ]
    };
    const silverOrderRes = await request('/api/bar/orders', {
      method: 'POST',
      body: silverOrderPayload
    });
    assert(silverOrderRes.status === 201, 'POST /api/bar/orders for Silver member returned HTTP 201');
    const silverOrder = silverOrderRes.body.order || silverOrderRes.body;
    assert(silverOrder.subtotal === 920.00, 'Silver order subtotal is 920.00');
    assert(silverOrder.discountPercentage === 10.00, 'Silver member receives 10% discount');
    assert(silverOrder.discountAmount === 92.00, 'Silver discount is 92.00 (920 * 0.10)');
    // Discounted = 828.00. Tax = 828 * 0.05 = 41.40. Total = 869.40
    assert(silverOrder.tax === 41.40, 'Tax is 41.40');
    assert(silverOrder.total === 869.40, 'Total is 869.40');

    // ------------------------------------------------------------------------
    // TEST 6: ADDING ITEMS TO AN EXISTING OPEN TAB
    // ------------------------------------------------------------------------
    console.log('\n[TEST 6] Adding Items to Open Tab');
    const addItemsRes = await request(`/api/bar/orders/${guestOrder.id}/items`, {
      method: 'POST',
      body: {
        items: [
          { itemId: 'rec-1', quantity: 2, notes: 'Extra ice' } // 240 * 2 = 480
        ]
      }
    });
    assert(addItemsRes.status === 200, `POST /api/bar/orders/${guestOrder.id}/items returned HTTP 200`);
    const updatedGuestOrder = addItemsRes.body.order || addItemsRes.body;
    // New subtotal = 1100 + 480 = 1580.00. Tax = 1580 * 0.05 = 79.00. Total = 1659.00
    assert(updatedGuestOrder.subtotal === 1580.00, 'Subtotal updated to 1580.00 after adding items');
    assert(updatedGuestOrder.total === 1659.00, 'Total updated to 1659.00');
    assert(updatedGuestOrder.items.length === 3, 'Order now contains 3 distinct item entries');

    // ------------------------------------------------------------------------
    // TEST 7: UPDATING ITEM QUANTITY & NOTES
    // ------------------------------------------------------------------------
    console.log('\n[TEST 7] Updating Item Quantity and Notes');
    const updateItemRes = await request(`/api/bar/orders/${guestOrder.id}/items/bev-1`, {
      method: 'PATCH',
      body: {
        quantity: 3, // Changed from 2 to 3 (+380 -> subtotal 1580 + 380 = 1960)
        notes: 'Chilled pint glasses'
      }
    });
    assert(updateItemRes.status === 200, 'PATCH item returned HTTP 200');
    const itemUpdatedOrder = updateItemRes.body.order || updateItemRes.body;
    // Subtotal = 1960.00. Tax = 1960 * 0.05 = 98.00. Total = 2058.00
    assert(itemUpdatedOrder.subtotal === 1960.00, 'Subtotal updated after quantity increase to 1960.00');
    assert(itemUpdatedOrder.total === 2058.00, 'Total updated to 2058.00');

    // ------------------------------------------------------------------------
    // TEST 8: KITCHEN STATUS PROGRESSION (PENDING -> PREPARING -> READY -> SERVED)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 8] Kitchen Progression Workflow');
    const statusPrep = await request(`/api/bar/orders/${guestOrder.id}/status`, {
      method: 'PATCH',
      body: { status: 'PREPARING' }
    });
    assert(statusPrep.status === 200, 'Transitioned to PREPARING');
    assert((statusPrep.body.kitchenStatus || statusPrep.body.order?.kitchenStatus) === 'PREPARING', 'Kitchen status is PREPARING');

    const statusReady = await request(`/api/bar/orders/${guestOrder.id}/status`, {
      method: 'PATCH',
      body: { status: 'READY' }
    });
    assert(statusReady.status === 200, 'Transitioned to READY');
    assert((statusReady.body.kitchenStatus || statusReady.body.order?.kitchenStatus) === 'READY', 'Kitchen status is READY');

    const statusServed = await request(`/api/bar/orders/${guestOrder.id}/status`, {
      method: 'PATCH',
      body: { status: 'SERVED' }
    });
    assert(statusServed.status === 200, 'Transitioned to SERVED');
    assert((statusServed.body.kitchenStatus || statusServed.body.order?.kitchenStatus) === 'SERVED', 'Kitchen status is SERVED');

    // ------------------------------------------------------------------------
    // TEST 9: CASH SETTLEMENT & PAYMENT TRANSACTION RECORD
    // ------------------------------------------------------------------------
    console.log('\n[TEST 9] Cash Settlement & Payment Recording');
    const cashSettleRes = await request(`/api/bar/orders/${guestOrder.id}/settle`, {
      method: 'POST',
      body: {
        paymentMethod: 'cash',
        amount: 2058.00
      }
    });
    assert(cashSettleRes.status === 200, 'POST /api/bar/orders/:id/settle returned HTTP 200');
    assert(cashSettleRes.body.success === true, 'Settlement response returned success true');
    assert(cashSettleRes.body.paymentMethod === 'cash', 'Payment method recorded as cash');
    assert(cashSettleRes.body.receiptNumber && cashSettleRes.body.receiptNumber.startsWith('RCP-'), 'Receipt number generated');
    assert(cashSettleRes.body.order.status === 'settled', 'Order status marked as settled');

    // Verify payment record in database
    const paymentCheck = await query('SELECT * FROM payments WHERE amount = $1 ORDER BY created_at DESC LIMIT 1', [2058.00]);
    assert(paymentCheck.rowCount === 1, 'Payment record was written to payments table');
    assert(paymentCheck.rows[0].payment_method === 'cash', 'Payment method is cash in payments table');

    // Verify table 2 is now available
    const table2Check = await request('/api/bar/tables');
    const table2 = table2Check.body.find(t => t.id === 'table-2');
    assert(table2.status === 'available', 'Table 2 status was restored to available');
    assert(table2.currentOrderId === null, 'Table 2 currentOrderId cleared');

    // ------------------------------------------------------------------------
    // TEST 10: CARD SETTLEMENT
    // ------------------------------------------------------------------------
    console.log('\n[TEST 10] Card Settlement');
    const cardSettleRes = await request(`/api/bar/orders/${goldOrder.id}/settle`, {
      method: 'POST',
      body: {
        paymentMethod: 'card',
        amount: 1445.85
      }
    });
    assert(cardSettleRes.status === 200, 'Card settlement returned HTTP 200');
    assert(cardSettleRes.body.paymentMethod === 'card', 'Payment method recorded as card');
    assert(cardSettleRes.body.order.status === 'settled', 'Gold order marked as settled');

    // ------------------------------------------------------------------------
    // TEST 11: UPI SETTLEMENT
    // ------------------------------------------------------------------------
    console.log('\n[TEST 11] UPI Settlement');
    const upiSettleRes = await request(`/api/bar/orders/${silverOrder.id}/settle`, {
      method: 'POST',
      body: {
        paymentMethod: 'upi',
        amount: 869.40,
        transactionReference: 'UPI-REF-998822'
      }
    });
    assert(upiSettleRes.status === 200, 'UPI settlement returned HTTP 200');
    assert(upiSettleRes.body.paymentMethod === 'upi', 'Payment method recorded as upi');
    assert(upiSettleRes.body.order.status === 'settled', 'Silver order marked as settled');

    // ------------------------------------------------------------------------
    // TEST 12: DUPLICATE SETTLEMENT PREVENTION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 12] Duplicate Settlement Prevention (Do not settle twice)');
    const duplicateSettleRes = await request(`/api/bar/orders/${guestOrder.id}/settle`, {
      method: 'POST',
      body: { paymentMethod: 'cash' }
    });
    assert(
      duplicateSettleRes.status === 409 || duplicateSettleRes.status === 422,
      `Attempting to settle already-settled order rejected with HTTP ${duplicateSettleRes.status}`
    );
    assert(
      duplicateSettleRes.body.message.includes('already settled') || duplicateSettleRes.body.message.includes('Duplicate settlement'),
      'Clear error message explaining duplicate settlement is forbidden'
    );

    // ------------------------------------------------------------------------
    // TEST 13: VALIDATION & EDGE CASE REJECTIONS
    // ------------------------------------------------------------------------
    console.log('\n[TEST 13] Validation and Edge Case Rejections');

    // Rejection 1: Negative quantity in order creation
    const invalidQtyRes = await request('/api/bar/orders', {
      method: 'POST',
      body: {
        tableId: 'table-4',
        items: [{ itemId: 'bev-1', quantity: -2 }]
      }
    });
    assert(invalidQtyRes.status === 422, 'Negative quantity rejected with HTTP 422');

    // Rejection 2: Zero quantity
    const zeroQtyRes = await request('/api/bar/orders', {
      method: 'POST',
      body: {
        tableId: 'table-4',
        items: [{ itemId: 'bev-1', quantity: 0 }]
      }
    });
    assert(zeroQtyRes.status === 422, 'Zero quantity rejected with HTTP 422');

    // Rejection 3: Non-existent menu item
    const unknownItemRes = await request('/api/bar/orders', {
      method: 'POST',
      body: {
        tableId: 'table-4',
        items: [{ itemId: 'non-existent-menu-item-999', quantity: 1 }]
      }
    });
    assert(unknownItemRes.status === 422 || unknownItemRes.status === 404, 'Non-existent item rejected');

    // Rejection 4: Non-existent table
    const unknownTableRes = await request('/api/bar/orders', {
      method: 'POST',
      body: {
        tableId: 'non-existent-table-999',
        items: [{ itemId: 'bev-1', quantity: 1 }]
      }
    });
    assert(unknownTableRes.status === 404 || unknownTableRes.status === 422, 'Non-existent table rejected');

    // Rejection 5: Conflicting open tab on already occupied table
    const conflictTableRes = await request('/api/bar/orders', {
      method: 'POST',
      body: {
        tableId: 'table-1', // table-1 already has open tab ORD-201
        items: [{ itemId: 'bev-1', quantity: 1 }]
      }
    });
    assert(conflictTableRes.status === 409, 'Opening tab on already active table rejected with HTTP 409 Conflict');

    // Rejection 6: Adding items to an already settled order
    const addSettledRes = await request(`/api/bar/orders/${guestOrder.id}/items`, {
      method: 'POST',
      body: { items: [{ itemId: 'bev-1', quantity: 1 }] }
    });
    assert(addSettledRes.status === 422 || addSettledRes.status === 400, 'Adding items to settled order rejected');

    // Rejection 7: Missing payment method during settlement
    // Create new temporary order on table 4 to test missing payment method
    const tempOrderRes = await request('/api/bar/orders', {
      method: 'POST',
      body: {
        tableId: 'table-4',
        items: [{ itemId: 'bev-1', quantity: 1 }]
      }
    });
    assert(tempOrderRes.status === 201, 'Temporary order created successfully on table-4');
    const tempOrder = tempOrderRes.body.order || tempOrderRes.body;
    const noMethodSettleRes = await request(`/api/bar/orders/${tempOrder.id}/settle`, {
      method: 'POST',
      body: {}
    });
    assert(noMethodSettleRes.status === 422, 'Missing payment method rejected with HTTP 422');

    // Rejection 8: Insufficient payment amount
    const lowAmountSettleRes = await request(`/api/bar/orders/${tempOrder.id}/settle`, {
      method: 'POST',
      body: {
        paymentMethod: 'cash',
        amount: 50.00 // Total is 380 + 19 = 399.00
      }
    });
    assert(lowAmountSettleRes.status === 422, 'Insufficient settlement amount rejected with HTTP 422');

    console.log('\n===============================================================');
    console.log(`ALL BAR POS TESTS PASSED! (${testsPassed} assertions passed, 0 failed)`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\nTest Suite Execution Aborted:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
}

if (require.main === module) {
  runBarTests().then(() => {
    process.exit(process.exitCode || 0);
  });
}

module.exports = { runBarTests };
