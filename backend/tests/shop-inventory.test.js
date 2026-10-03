/**
 * Champions Club - Shop, Inventory & Orders Test Suite
 * Role: MEMBER 4 (Backend Operations)
 * 
 * Tests:
 * 1. Product catalogue listing & search filters
 * 2. Product creation & inventory shelf initialization
 * 3. Low-stock visibility (GET /api/inventory/low-stock)
 * 4. Counter order (in-store purchase, stock decrement, stock movement logged)
 * 5. Online pickup order (pickup time stored, shared shelf inventory decremented)
 * 6. Online delivery order (address & notes stored, shared shelf inventory decremented)
 * 7. Member discount calculations (Gold tier 20% savings vs standard retail)
 * 8. Insufficient stock rejection (HTTP 409 conflict, inventory preserved)
 * 9. Concurrent orders race-condition safety (row-locking prevents overselling)
 * 10. Order cancellation and automatic shelf inventory restocking
 */

const http = require('http');
const app = require('../src/app');
const config = require('../src/config/env');
const { initSchema } = require('../src/db/init');
const { seedDatabase } = require('../src/db/seed');
const { pool } = require('../src/config/database');

let server;
let baseUrl;
let adminToken;

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

async function runShopTests() {
  console.log('===============================================================');
  console.log('CHAMPIONS CLUB - SHOP, INVENTORY & ORDERS TEST SUITE');
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

    // 3. Login as admin to get auth token
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@championsclub.com',
        password: 'Password@123'
      }
    });
    adminToken = loginRes.body.data.token;
    assert(adminToken, 'Admin authenticated for operations testing');

    // ------------------------------------------------------------------------
    // TEST 1: PRODUCT CATALOGUE LISTING & FILTERS
    // ------------------------------------------------------------------------
    console.log('\n[TEST 1] Product Catalogue & Filters');
    const allProductsRes = await request('/api/products');
    assert(allProductsRes.status === 200, 'GET /api/products returned HTTP 200');
    assert(Array.isArray(allProductsRes.body) && allProductsRes.body.length >= 8, 'Listed 8 initial catalog products');

    const racketCategoryRes = await request('/api/products?category=Rackets');
    assert(racketCategoryRes.status === 200, 'GET /api/products?category=Rackets returned HTTP 200');
    assert(racketCategoryRes.body.every(p => p.category.toLowerCase().includes('racket')), 'Filtered only racket products');

    // ------------------------------------------------------------------------
    // TEST 2: CREATE PRODUCT & INVENTORY SHELF INITIALIZATION
    // ------------------------------------------------------------------------
    console.log('\n[TEST 2] Product Creation & Inventory Initialization');
    const newProductRes = await request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        id: 'prod-grip-pro',
        categoryId: 'accessories',
        sportId: 'tennis',
        name: 'Champions Pro Comfort Overgrips (Pack of 3)',
        price: 450,
        memberPrice: 360,
        initialStock: 25,
        reorderThreshold: 5,
        reorderQuantity: 30,
        description: 'Ultra-absorbent high-tack overgrips for competitive play'
      }
    });
    assert(newProductRes.status === 201, 'POST /api/products created new product (HTTP 201)');
    assert(newProductRes.body.data.stock === 25, 'Initialized inventory quantity on hand to 25');

    // Verify stock movement was recorded
    const movementsRes = await pool.query(
      "SELECT * FROM stock_movements WHERE product_id = 'prod-grip-pro' AND movement_type = 'purchase_receipt'"
    );
    assert(movementsRes.rowCount === 1 && movementsRes.rows[0].quantity === 25, 'Initial stock intake logged in stock_movements');

    // ------------------------------------------------------------------------
    // TEST 3: LOW-STOCK VISIBILITY
    // ------------------------------------------------------------------------
    console.log('\n[TEST 3] Low-Stock Visibility');
    const lowStockRes = await request('/api/inventory/low-stock', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(lowStockRes.status === 200, 'GET /api/inventory/low-stock returned HTTP 200');
    assert(lowStockRes.body.success === true, 'Low stock response indicated success');
    assert(lowStockRes.body.data.every(item => item.quantityOnHand <= item.reorderThreshold), 'All low-stock items satisfy quantityOnHand <= reorderThreshold');

    // ------------------------------------------------------------------------
    // TEST 4: COUNTER ORDER (SHARED SHELF STOCK CONSUMPTION)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 4] Counter Order (In-Store Purchase)');
    const initialProd1Stock = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-1'")).rows[0].quantity_on_hand;

    const counterOrderRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        orderType: 'counter',
        fulfilmentType: 'in_store',
        customerName: 'Walk-in Member',
        items: [
          { productId: 'prod-1', quantity: 2 }
        ],
        paymentStatus: 'paid'
      }
    });
    assert(counterOrderRes.status === 201, 'POST /api/shop/orders created counter order (HTTP 201)');
    assert(counterOrderRes.body.data.orderType === 'counter', 'Order type is recorded as counter');

    // Verify shelf stock decreased by 2
    const afterCounterStock = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-1'")).rows[0].quantity_on_hand;
    assert(afterCounterStock === initialProd1Stock - 2, `Inventory decreased exactly by 2 (from ${initialProd1Stock} to ${afterCounterStock})`);

    // Verify stock movement
    const counterMovement = (await pool.query("SELECT * FROM stock_movements WHERE reference_id = $1", [counterOrderRes.body.data.orderNumber])).rows[0];
    assert(counterMovement && counterMovement.quantity === -2 && counterMovement.movement_type === 'sale', 'Stock movement recorded with -2 quantity and movement_type = sale');

    // ------------------------------------------------------------------------
    // TEST 5: ONLINE PICKUP ORDER (SHARED SHELF INVENTORY)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 5] Online Pickup Order');
    const onlinePickupRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        orderType: 'online_pickup',
        fulfilmentType: 'pickup',
        customerName: 'Sarah Jenkins',
        customerEmail: 'sarah.jenkins@example.com',
        customerPhone: '+919876543212',
        pickupTime: '2026-10-15T18:00:00Z',
        items: [
          { productId: 'prod-1', quantity: 1 }
        ]
      }
    });
    assert(onlinePickupRes.status === 201, 'POST /api/shop/orders created online pickup order (HTTP 201)');
    assert(onlinePickupRes.body.data.fulfilmentType === 'pickup', 'Fulfilment type recorded as pickup');
    assert(onlinePickupRes.body.data.pickupTime !== null, 'Pickup time stored accurately');

    const afterPickupStock = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-1'")).rows[0].quantity_on_hand;
    assert(afterPickupStock === afterCounterStock - 1, 'Online pickup deducted from the SAME shelf inventory');

    // ------------------------------------------------------------------------
    // TEST 6: ONLINE DELIVERY ORDER (SHARED SHELF INVENTORY & ADDRESS)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 6] Online Delivery Order');
    const onlineDeliveryRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        orderType: 'online_delivery',
        fulfilmentType: 'delivery',
        customerName: 'Devon Conway',
        customerEmail: 'devon.conway@example.com',
        customerPhone: '+919876543211',
        deliveryAddress: 'Villa 42, Palm Meadows, Ahmedabad',
        deliveryNotes: 'Please ring the bell at main gate',
        items: [
          { productId: 'prod-2', quantity: 5 }
        ]
      }
    });
    assert(onlineDeliveryRes.status === 201, 'POST /api/shop/orders created online delivery order (HTTP 201)');
    assert(onlineDeliveryRes.body.data.fulfilmentType === 'delivery', 'Fulfilment type recorded as delivery');
    assert(onlineDeliveryRes.body.data.deliveryAddress === 'Villa 42, Palm Meadows, Ahmedabad', 'Delivery address stored');
    assert(onlineDeliveryRes.body.data.deliveryNotes === 'Please ring the bell at main gate', 'Delivery notes stored');

    // ------------------------------------------------------------------------
    // TEST 7: MEMBER DISCOUNT CALCULATIONS (GOLD 20% DISCOUNT)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 7] Member Discount Calculations');
    // Non-member order for prod-2 (retail 699 each * 2 = 1398)
    const guestOrderRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        orderType: 'counter',
        items: [{ productId: 'prod-2', quantity: 2 }]
      }
    });
    const guestOrder = guestOrderRes.body.data;
    assert(guestOrder.discountAmount === 0, 'Guest order receives 0 discount');
    assert(guestOrder.subtotal === 1398, 'Guest subtotal is 2 * 699 = 1398');

    // Gold member order (MEM-8801 has Gold membership plan -> 20% discount)
    const goldOrderRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        memberId: 'MEM-8801',
        orderType: 'counter',
        items: [{ productId: 'prod-2', quantity: 2 }]
      }
    });
    const goldOrder = goldOrderRes.body.data;
    const expectedDiscount = Math.round(1398 * 0.20 * 100) / 100;
    assert(goldOrder.discountAmount === expectedDiscount, `Gold member received exact 20% discount: ${goldOrder.discountAmount}`);
    assert(goldOrder.items[0].unitPrice === 559.2 || goldOrder.items[0].unitPrice === 559, 'Unit price reflected 20% discount');

    // ------------------------------------------------------------------------
    // TEST 8: INSUFFICIENT STOCK REJECTION (HTTP 409)
    // ------------------------------------------------------------------------
    console.log('\n[TEST 8] Insufficient Stock Rejection');
    const prod4Stock = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-4'")).rows[0].quantity_on_hand;

    const excessOrderRes = await request('/api/shop/orders', {
      method: 'POST',
      body: {
        orderType: 'counter',
        items: [{ productId: 'prod-4', quantity: prod4Stock + 100 }]
      }
    });
    assert(excessOrderRes.status === 409, 'Excess order rejected with HTTP 409 Conflict');

    const prod4StockAfter = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-4'")).rows[0].quantity_on_hand;
    assert(prod4StockAfter === prod4Stock, 'Inventory unchanged after rejected order');

    // ------------------------------------------------------------------------
    // TEST 9: CONCURRENT STOCK CONSUMPTION SAFETY
    // ------------------------------------------------------------------------
    console.log('\n[TEST 9] Concurrent Stock Consumption Safety');
    // Set stock of prod-3 to exactly 3 units
    await pool.query("UPDATE inventory SET quantity_on_hand = 3 WHERE product_id = 'prod-3'");

    // Launch 5 concurrent order requests of 1 unit each
    const orderPromises = [1, 2, 3, 4, 5].map((idx) =>
      request('/api/shop/orders', {
        method: 'POST',
        body: {
          orderType: 'online_delivery',
          deliveryAddress: `Test Address ${idx}`,
          items: [{ productId: 'prod-3', quantity: 1 }]
        }
      })
    );

    const concurrentResults = await Promise.all(orderPromises);
    const successfulOrders = concurrentResults.filter(r => r.status === 201);
    const rejectedOrders = concurrentResults.filter(r => r.status === 409);

    assert(successfulOrders.length === 3, 'Exactly 3 concurrent orders succeeded');
    assert(rejectedOrders.length === 2, 'Exactly 2 excess concurrent orders were rejected with HTTP 409');

    const finalProd3Stock = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-3'")).rows[0].quantity_on_hand;
    assert(finalProd3Stock === 0, 'Final inventory reached exactly 0 without going negative');

    // ------------------------------------------------------------------------
    // TEST 10: ORDER CANCELLATION & AUTOMATIC RESTOCKING
    // ------------------------------------------------------------------------
    console.log('\n[TEST 10] Order Cancellation & Automatic Restocking');
    const orderToCancel = successfulOrders[0].body.data;
    const stockBeforeCancel = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-3'")).rows[0].quantity_on_hand;

    const cancelRes = await request(`/api/shop/orders/${orderToCancel.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'cancelled', notes: 'Customer changed mind' }
    });
    assert(cancelRes.status === 200, 'Order status transitioned to cancelled (HTTP 200)');
    assert(cancelRes.body.data.status === 'cancelled', 'Order status verified as cancelled');

    const stockAfterCancel = (await pool.query("SELECT quantity_on_hand FROM inventory WHERE product_id = 'prod-3'")).rows[0].quantity_on_hand;
    assert(stockAfterCancel === stockBeforeCancel + 1, 'Cancelled order automatically restocked 1 unit of inventory');

    // Verify return stock movement
    const returnMovement = (await pool.query("SELECT * FROM stock_movements WHERE reference_id = $1 AND movement_type = 'return'", [orderToCancel.orderNumber])).rows[0];
    assert(returnMovement && returnMovement.quantity === 1, 'Return stock movement logged with +1 quantity');

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${testsPassed} passed, ${testsFailed} failed.`);
    console.log('===============================================================\n');

    server.close();
  } catch (err) {
    console.error('\n❌ FATAL SHOP TEST ERROR:', err);
    if (server) server.close();
    process.exit(1);
  }
}

if (require.main === module) {
  runShopTests();
}

module.exports = { runShopTests };
