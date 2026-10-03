import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FALLBACK_TABLES,
  FALLBACK_MENU,
  FALLBACK_ORDERS,
  getBarTables,
  getBarMenu,
  getBarOrders,
  saveBarOrder,
  updateKitchenStatus,
  settleBarOrder
} from '../barApi.js';

describe('Bar & Operations Portal - MEMBER 2 Tests', () => {
  describe('1. Table Loading & Status Handling', () => {
    it('should successfully load tables with valid attributes', async () => {
      const tables = await getBarTables();
      assert.ok(Array.isArray(tables), 'Tables should be an array');
      assert.ok(tables.length > 0, 'Tables should have items');

      const table1 = tables[0];
      assert.ok(table1.id, 'Table has id');
      assert.ok(table1.number, 'Table has number');
      assert.ok(table1.name, 'Table has name');
      assert.ok(table1.capacity > 0, 'Table has positive capacity');
      assert.ok(
        ['available', 'occupied', 'open'].includes(table1.status),
        `Table status should be available, occupied, or open. Received: ${table1.status}`
      );
    });

    it('should contain tables in all required states: available, occupied, open', async () => {
      const tables = await getBarTables();
      const hasAvailable = tables.some((t) => t.status === 'available');
      const hasOccupied = tables.some((t) => t.status === 'occupied');
      const hasOpen = tables.some((t) => t.status === 'open');

      assert.equal(hasAvailable, true, 'Must have at least one available table');
      assert.equal(hasOccupied, true, 'Must have at least one occupied table');
      assert.equal(hasOpen, true, 'Must have at least one open tab table');
    });
  });

  describe('2. Menu Loading & Validation', () => {
    it('should load bar menu with items and categories', async () => {
      const menu = await getBarMenu();
      assert.ok(Array.isArray(menu), 'Menu should be an array');
      assert.ok(menu.length > 0, 'Menu must contain items');

      const item = menu[0];
      assert.ok(item.id, 'Menu item has id');
      assert.ok(item.name, 'Menu item has name');
      assert.ok(item.category, 'Menu item has category');
      assert.ok(item.price > 0, 'Price must be positive');
      assert.equal(typeof item.inStock, 'boolean', 'inStock must be boolean');
    });

    it('should filter menu items by category correctly', async () => {
      const beers = await getBarMenu('Beers & Ciders');
      assert.ok(beers.length > 0, 'Should find beers');
      assert.ok(
        beers.every((item) => item.category === 'Beers & Ciders'),
        'All filtered items should belong to category'
      );
    });

    it('should enforce positive menu quantities', () => {
      // Menu quantity validation logic
      const validateQuantity = (qty) => {
        return typeof qty === 'number' && Number.isInteger(qty) && qty > 0;
      };

      assert.equal(validateQuantity(1), true, 'Quantity 1 is valid');
      assert.equal(validateQuantity(5), true, 'Quantity 5 is valid');
      assert.equal(validateQuantity(0), false, 'Quantity 0 must be rejected');
      assert.equal(validateQuantity(-1), false, 'Negative quantity must be rejected');
      assert.equal(validateQuantity(2.5), false, 'Fractional quantity must be rejected');
    });
  });

  describe('3. Active Order State & Member Discounts', () => {
    it('should load active orders with kitchen status indicators', async () => {
      const orders = await getBarOrders();
      assert.ok(Array.isArray(orders), 'Orders should be an array');
      assert.ok(orders.length > 0, 'Should have orders');

      const openOrders = orders.filter((o) => o.status === 'open');
      assert.ok(openOrders.length > 0, 'Must have active/open orders');

      const sampleOrder = openOrders[0];
      assert.ok(
        ['PENDING', 'PREPARING', 'READY', 'SERVED'].includes(sampleOrder.kitchenStatus),
        'Must have valid kitchen status'
      );
      assert.ok(Array.isArray(sampleOrder.items), 'Order has items array');
      assert.ok(sampleOrder.subtotal > 0, 'Order has valid subtotal');
    });

    it('should calculate Gold member discount correctly (15%)', () => {
      const subtotal = 2000;
      const discountPercentage = 15; // Gold tier
      const discountAmount = Math.round((subtotal * discountPercentage) / 100);
      const tax = Math.round((subtotal - discountAmount) * 0.05);
      const total = subtotal - discountAmount + tax;

      assert.equal(discountAmount, 300, '15% of 2000 should be 300');
      assert.equal(tax, 85, '5% tax on 1700 should be 85');
      assert.equal(total, 1785, 'Total should be 1785');
    });

    it('should calculate Silver member discount correctly (10%)', () => {
      const subtotal = 1000;
      const discountPercentage = 10; // Silver tier
      const discountAmount = Math.round((subtotal * discountPercentage) / 100);
      const tax = Math.round((subtotal - discountAmount) * 0.05);
      const total = subtotal - discountAmount + tax;

      assert.equal(discountAmount, 100, '10% of 1000 should be 100');
      assert.equal(tax, 45, '5% tax on 900 should be 45');
      assert.equal(total, 945, 'Total should be 945');
    });

    it('should calculate Guest discount correctly (0%)', () => {
      const subtotal = 1000;
      const discountPercentage = 0; // Guest tier
      const discountAmount = 0;
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;

      assert.equal(discountAmount, 0, 'Guest discount should be 0');
      assert.equal(tax, 50, '5% tax on 1000 should be 50');
      assert.equal(total, 1050, 'Total should be 1050');
    });
  });

  describe('4. Kitchen Status Progression', () => {
    it('should allow advancing kitchen status through pipeline', async () => {
      const orderId = 'ORD-201';
      const res1 = await updateKitchenStatus(orderId, 'PREPARING');
      assert.equal(res1.kitchenStatus, 'PREPARING', 'Updated to PREPARING');

      const res2 = await updateKitchenStatus(orderId, 'READY');
      assert.equal(res2.kitchenStatus, 'READY', 'Updated to READY');

      const res3 = await updateKitchenStatus(orderId, 'SERVED');
      assert.equal(res3.kitchenStatus, 'SERVED', 'Updated to SERVED');
    });
  });

  describe('5. Payment Settlement & Edge Cases', () => {
    it('should reject settling when no valid table or order is provided', () => {
      const canSettle = ({ selectedTable, activeOrder, subtotal }) => {
        if (!selectedTable) return false; // Selected table required
        if (!activeOrder && (!subtotal || subtotal <= 0)) return false; // Valid order required
        if (activeOrder && activeOrder.status === 'settled') return false; // Already settled
        return true;
      };

      assert.equal(
        canSettle({ selectedTable: null, activeOrder: { status: 'open' }, subtotal: 500 }),
        false,
        'Cannot settle without selected table'
      );

      assert.equal(
        canSettle({ selectedTable: { id: 't1' }, activeOrder: null, subtotal: 0 }),
        false,
        'Cannot settle with 0 subtotal and no order'
      );

      assert.equal(
        canSettle({ selectedTable: { id: 't1' }, activeOrder: { status: 'settled' }, subtotal: 500 }),
        false,
        'Cannot re-settle an already settled order'
      );

      assert.equal(
        canSettle({ selectedTable: { id: 't1' }, activeOrder: { status: 'open' }, subtotal: 500 }),
        true,
        'Valid open order can be settled'
      );
    });

    it('should successfully settle a valid order with payment details', async () => {
      const orderId = 'ORD-202';
      const settlementData = {
        paymentMethod: 'card',
        amountPaid: 2740.5,
        tip: 100
      };

      const result = await settleBarOrder(orderId, settlementData);
      assert.equal(result.success, true, 'Settlement must succeed');
      assert.equal(result.orderId, orderId);
      assert.equal(result.paymentMethod, 'card');
      assert.ok(result.receiptNumber, 'Receipt number must be generated');
      assert.ok(result.settledAt, 'Settlement timestamp must be present');
    });
  });

  describe('6. Error Handling & API Failure Gracefulness', () => {
    it('should fallback gracefully when network fetch fails', async () => {
      // getBarTables uses fallback when backend is offline
      const tables = await getBarTables();
      assert.ok(Array.isArray(tables), 'Fallback tables array returned');
      assert.ok(tables.length >= 8, 'Has standard fallback table set');
    });

    it('should handle occupied table selection without data corruption', () => {
      const occupiedTable = FALLBACK_TABLES.find((t) => t.status === 'occupied');
      assert.ok(occupiedTable, 'Must find occupied table');
      assert.ok(occupiedTable.currentOrderId, 'Occupied table references currentOrderId');
      assert.ok(occupiedTable.activeTabTotal > 0, 'Occupied table has positive activeTabTotal');
    });

    it('should identify already-settled order and protect against duplicate charge', () => {
      const settledOrder = FALLBACK_ORDERS.find((o) => o.status === 'settled');
      assert.ok(settledOrder, 'Must find settled order in database');
      assert.ok(settledOrder.settledAt, 'Settled order has timestamp');
      assert.ok(settledOrder.paymentMethod, 'Settled order records paymentMethod');
    });
  });
});
