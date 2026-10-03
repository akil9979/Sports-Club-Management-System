import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getProducts,
  getProductById,
  createShopOrder,
  getShopOrders,
  getShopOrderById,
  getStoredCart,
  saveStoredCart,
  clearStoredCart,
  FALLBACK_PRODUCTS
} from '../shopApi.js';

describe('Member 1 - Shop & Online Shopping Experience Tests', () => {

  beforeEach(() => {
    clearStoredCart();
  });

  // 1. Catalogue Loading & Product Schema Verification
  test('getProducts retrieves products with canonical schema', async () => {
    const products = await getProducts();
    assert.ok(Array.isArray(products), 'Products should be an array');
    assert.ok(products.length >= 5, 'Should return at least 5 products from seed/fallback');

    const sample = products[0];
    assert.ok(sample.id, 'Product must have an id');
    assert.ok(sample.name, 'Product must have a name');
    assert.ok(sample.category, 'Product must have a category');
    assert.ok(typeof sample.price === 'number', 'Product price must be a number');
    assert.ok(typeof sample.stock === 'number', 'Product stock must be a number');
    assert.ok(typeof sample.inStock === 'boolean', 'Product inStock must be a boolean');
  });

  // 2. Category and Search Filtering
  test('getProducts filters by category and search keyword', async () => {
    const rackets = await getProducts({ category: 'Rackets' });
    assert.ok(rackets.length > 0, 'Should find racket products');
    rackets.forEach(p => {
      assert.equal(p.category.toLowerCase(), 'rackets');
    });

    const searchResults = await getProducts({ search: 'Wilson' });
    assert.ok(searchResults.length > 0, 'Should find products matching "Wilson"');
    searchResults.forEach(p => {
      const match = p.name.includes('Wilson') || p.description?.includes('Wilson') || p.sku?.includes('WILSON');
      assert.ok(match, 'Result should match search keyword');
    });

    const inStockOnly = await getProducts({ inStock: true });
    inStockOnly.forEach(p => {
      assert.equal(p.inStock, true, 'All returned items should be in stock');
    });
  });

  // 3. Product Details Retrieval
  test('getProductById retrieves specific product or throws 404', async () => {
    const product = await getProductById('prod-1');
    assert.ok(product);
    assert.equal(product.id, 'prod-1');
    assert.ok(product.name.includes('Head Speed'));

    await assert.rejects(
      async () => {
        await getProductById('non-existent-product-id-9999');
      },
      (err) => err.statusCode === 404 || err.status === 404 || err.message.includes('not found')
    );
  });

  // 4. Cart Storage Helpers
  test('Cart storage functions properly serialize and clear cart items', () => {
    const sampleCart = [
      { product: FALLBACK_PRODUCTS[0], quantity: 2 },
      { product: FALLBACK_PRODUCTS[1], quantity: 1 }
    ];

    saveStoredCart(sampleCart);
    const retrieved = getStoredCart();
    assert.equal(retrieved.length, 2);
    assert.equal(retrieved[0].product.id, 'prod-1');
    assert.equal(retrieved[0].quantity, 2);

    clearStoredCart();
    assert.equal(getStoredCart().length, 0);
  });

  // 5. Validation: Empty Cart Checkout Prevention
  test('createShopOrder rejects empty cart or invalid items array', async () => {
    await assert.rejects(
      async () => {
        await createShopOrder({ items: [] });
      },
      (err) => err.status === 422 || err.message.includes('empty shopping cart')
    );

    await assert.rejects(
      async () => {
        await createShopOrder({ items: null });
      },
      (err) => err.status === 422 || err.message.includes('empty shopping cart')
    );
  });

  // 6. Validation: Positive Integer Quantities Only
  test('createShopOrder rejects zero, negative, or fractional quantities', async () => {
    await assert.rejects(
      async () => {
        await createShopOrder({
          items: [{ productId: 'prod-1', quantity: 0 }]
        });
      },
      (err) => err.status === 422 && err.message.includes('greater than 0')
    );

    await assert.rejects(
      async () => {
        await createShopOrder({
          items: [{ productId: 'prod-1', quantity: -3 }]
        });
      },
      (err) => err.status === 422 && err.message.includes('greater than 0')
    );

    await assert.rejects(
      async () => {
        await createShopOrder({
          items: [{ productId: 'prod-1', quantity: 2.5 }]
        });
      },
      (err) => err.status === 422 && err.message.includes('greater than 0')
    );
  });

  // 7. Validation: Delivery Address Requirement for Delivery Orders
  test('createShopOrder requires deliveryAddress when fulfilmentType is delivery', async () => {
    await assert.rejects(
      async () => {
        await createShopOrder({
          orderType: 'online_delivery',
          fulfilmentType: 'delivery',
          deliveryAddress: '', // empty
          items: [{ productId: 'prod-2', quantity: 2 }]
        });
      },
      (err) => err.status === 422 && err.message.includes('delivery address')
    );
  });

  // 8. Order Placement: Successful Counter Pickup Order
  test('createShopOrder creates successful pickup order with backend-calculated totals', async () => {
    const payload = {
      customerName: 'Devon Conway',
      customerEmail: 'devon@example.com',
      customerPhone: '+919876543210',
      orderType: 'online_pickup',
      fulfilmentType: 'pickup',
      items: [
        { productId: 'prod-2', quantity: 2 } // Wilson Balls (Price: 699 each)
      ]
    };

    const res = await createShopOrder(payload);
    assert.equal(res.success, true);
    assert.ok(res.data, 'Should return created order data');
    assert.ok(res.data.orderNumber.startsWith('SO-'), 'Order number should follow SO- format');
    assert.equal(res.data.status, 'pending');
    assert.equal(res.data.fulfilmentType, 'pickup');

    // Totals returned from backend
    assert.ok(res.data.subtotal > 0);
    assert.ok(typeof res.data.taxAmount === 'number');
    assert.ok(res.data.totalAmount > 0);
    assert.equal(res.data.items.length, 1);
    assert.equal(res.data.items[0].quantity, 2);
  });

  // 9. Order Placement: Successful Doorstep Delivery with Member Discount
  test('createShopOrder applies authoritative member discount when memberId is present', async () => {
    const payload = {
      memberId: 'MEM-8801',
      customerName: 'Devon Conway',
      customerEmail: 'devon@example.com',
      orderType: 'online_delivery',
      fulfilmentType: 'delivery',
      deliveryAddress: 'Villa 101, Palm Meadows, Bangalore',
      deliveryNotes: 'Leave at security desk',
      items: [
        { productId: 'prod-1', quantity: 1 } // Head Speed Pro (Price: 15499)
      ]
    };

    const res = await createShopOrder(payload);
    assert.equal(res.success, true);
    const order = res.data;
    assert.equal(order.memberId, 'MEM-8801');
    assert.equal(order.fulfilmentType, 'delivery');
    assert.equal(order.deliveryAddress, 'Villa 101, Palm Meadows, Bangalore');

    // Authoritative backend member discount verification
    assert.ok(order.discountAmount > 0, 'Member discount must be deducted by backend');
    assert.ok(order.totalAmount < order.subtotal + order.taxAmount, 'Total should reflect discount');
  });

  // 10. Edge Case: Insufficient Shelf Stock Rejection
  test('createShopOrder rejects purchase when requested quantity exceeds available stock', async () => {
    // Babolat RH12 Pure Aero Bag has 0 stock (Out of stock)
    await assert.rejects(
      async () => {
        await createShopOrder({
          customerName: 'Marcus Finch',
          customerEmail: 'marcus@example.com',
          orderType: 'online_pickup',
          items: [{ productId: 'prod-5', quantity: 1 }]
        });
      },
      (err) => err.status === 409 || err.message.includes('Insufficient shelf stock') || err.message.includes('Out of stock')
    );
  });

  // 11. Order History Retrieval
  test('getShopOrders and getShopOrderById retrieve placed orders and line items', async () => {
    // Fetch order history
    const orders = await getShopOrders();
    assert.ok(Array.isArray(orders), 'Orders should be an array');
    assert.ok(orders.length >= 1, 'Should contain the orders placed in previous tests');

    const firstOrder = orders[0];
    assert.ok(firstOrder.orderNumber);
    assert.ok(firstOrder.subtotal !== undefined);
    assert.ok(firstOrder.totalAmount !== undefined);

    // Fetch individual order by ID
    const retrieved = await getShopOrderById(firstOrder.id || firstOrder.orderNumber);
    assert.equal(retrieved.orderNumber, firstOrder.orderNumber);
    assert.ok(Array.isArray(retrieved.items));
  });

});
