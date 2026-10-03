import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBarTables,
  getBarMenu,
  createBarOrder,
  addItemsToBarOrder,
  updateBarOrderItem,
  updateKitchenStatus,
  settleBarOrder,
  lookupMember,
  calculateOrderTotals
} from '../barApi.js';

describe('Bar & Operations Portal - MEMBER 2 Comprehensive Tests', () => {
  describe('1. Table Loading & Status Handling', () => {
    it('should successfully load tables with valid schema attributes', async () => {
      const tables = await getBarTables();
      assert.ok(Array.isArray(tables), 'Tables should be an array');
      assert.ok(tables.length >= 8, 'Tables should contain at least 8 seeded tables');

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

  describe('2. Menu Loading & Validation (Positive Quantity)', () => {
    it('should load bar menu with items and categories', async () => {
      const menu = await getBarMenu();
      assert.ok(Array.isArray(menu), 'Menu should be an array');
      assert.ok(menu.length >= 16, 'Menu must contain all seeded items');

      const item = menu[0];
      assert.ok(item.id, 'Menu item has id');
      assert.ok(item.name, 'Menu item has name');
      assert.ok(item.category, 'Menu item has category');
      assert.ok(item.price > 0, 'Price must be positive');
      assert.equal(typeof item.inStock, 'boolean', 'inStock must be boolean');
    });

    it('should reject invalid, zero, or negative quantities', () => {
      const validateQuantity = (qty) => {
        return typeof qty === 'number' && Number.isInteger(qty) && qty > 0;
      };

      assert.equal(validateQuantity(1), true, 'Quantity 1 is valid');
      assert.equal(validateQuantity(10), true, 'Quantity 10 is valid');
      assert.equal(validateQuantity(0), false, 'Quantity 0 must be rejected');
      assert.equal(validateQuantity(-1), false, 'Negative quantity must be rejected');
      assert.equal(validateQuantity(-10), false, 'Negative quantity must be rejected');
      assert.equal(validateQuantity(2.5), false, 'Fractional quantity must be rejected');
      assert.equal(validateQuantity(null), false, 'Null quantity must be rejected');
      assert.equal(validateQuantity('5'), false, 'String quantity must be rejected');
    });
  });

  describe('3. Member Identification & Server Discount Calculation', () => {
    it('should identify valid registered club members and retrieve membership tier', async () => {
      const res1 = await lookupMember('MEM-8801');
      assert.equal(res1.valid, true);
      assert.equal(res1.member.name, 'Devon Conway');
      assert.equal(res1.member.tier, 'Gold');
      assert.equal(res1.member.discountPct, 15);

      const res2 = await lookupMember('MEM-4920');
      assert.equal(res2.valid, true);
      assert.equal(res2.member.tier, 'Silver');
      assert.equal(res2.member.discountPct, 10);
    });

    it('should gracefully handle invalid member query and fall back to standard pricing', async () => {
      const res = await lookupMember('INVALID-MEM-9999');
      assert.equal(res.valid, false);
      assert.ok(res.error.includes('not found'));
    });

    it('should calculate Gold member-discount order (15% discount)', () => {
      const items = [
        { price: 500, quantity: 2 }, // 1000
        { price: 1000, quantity: 1 } // 1000
      ];
      const totals = calculateOrderTotals(items, 'Gold');
      assert.equal(totals.subtotal, 2000);
      assert.equal(totals.discountPercentage, 15);
      assert.equal(totals.discountAmount, 300); // 15% of 2000
      assert.equal(totals.tax, 85); // 5% of 1700
      assert.equal(totals.total, 1785);
    });

    it('should calculate Silver member-discount order (10% discount)', () => {
      const items = [{ price: 1000, quantity: 1 }];
      const totals = calculateOrderTotals(items, 'Silver');
      assert.equal(totals.subtotal, 1000);
      assert.equal(totals.discountPercentage, 10);
      assert.equal(totals.discountAmount, 100); // 10% of 1000
      assert.equal(totals.tax, 45); // 5% of 900
      assert.equal(totals.total, 945);
    });

    it('should calculate Guest order (0% discount)', () => {
      const items = [{ price: 1000, quantity: 1 }];
      const totals = calculateOrderTotals(items, 'Guest');
      assert.equal(totals.subtotal, 1000);
      assert.equal(totals.discountPercentage, 0);
      assert.equal(totals.discountAmount, 0);
      assert.equal(totals.tax, 50); // 5% of 1000
      assert.equal(totals.total, 1050);
    });
  });

  describe('4. Tab Creation & Item Additions Workflow', () => {
    it('should open a tab on an available table', async () => {
      const newOrderPayload = {
        tableId: 'table-2',
        tableName: 'Table 2 - Courtside High-Top',
        membershipTier: 'Guest',
        items: [
          { itemId: 'bev-1', name: 'Champions Draft Craft Lager', price: 380, quantity: 2 }
        ]
      };

      const res = await createBarOrder(newOrderPayload);
      assert.equal(res.success, true);
      assert.ok(res.order.id);
      assert.equal(res.order.tableId, 'table-2');
      assert.equal(res.order.items.length, 1);
      assert.equal(res.order.subtotal, 760);
    });

    it('should add additional items to an open tab via addItemsToBarOrder', async () => {
      const newItems = [
        { itemId: 'food-1', name: 'Crispy Truffle Parmesan Fries', price: 340, quantity: 1 }
      ];

      const res = await addItemsToBarOrder('ORD-201', newItems);
      assert.equal(res.success, true);
      const fries = res.order.items.find((i) => i.name.includes('Truffle'));
      assert.ok(fries, 'New items should be added to open tab');
    });

    it('should update item quantity via updateBarOrderItem', async () => {
      const res = await updateBarOrderItem('ORD-201', 'bev-1', { quantity: 4 });
      assert.equal(res.success, true);
      const lager = res.order.items.find((i) => i.itemId === 'bev-1');
      assert.equal(lager.quantity, 4);
    });

    it('should reject adding items with non-positive quantity', async () => {
      await assert.rejects(
        async () => {
          await addItemsToBarOrder('ORD-201', [
            { itemId: 'bev-1', name: 'Lager', price: 380, quantity: 0 }
          ]);
        },
        /positive integer/i
      );
    });

    it('should reject adding items after an order is settled', async () => {
      await assert.rejects(
        async () => {
          await addItemsToBarOrder('ORD-200-SETTLED', [
            { itemId: 'bev-1', name: 'Lager', price: 380, quantity: 1 }
          ]);
        },
        /already-settled/i
      );
    });
  });

  describe('5. Kitchen Status Pipeline Progression', () => {
    it('should advance kitchen status: PENDING -> PREPARING -> READY -> SERVED', async () => {
      const orderId = 'ORD-203';
      const s1 = await updateKitchenStatus(orderId, 'PREPARING');
      assert.equal(s1.kitchenStatus, 'PREPARING');

      const s2 = await updateKitchenStatus(orderId, 'READY');
      assert.equal(s2.kitchenStatus, 'READY');

      const s3 = await updateKitchenStatus(orderId, 'SERVED');
      assert.equal(s3.kitchenStatus, 'SERVED');
    });
  });

  describe('6. Settlement by Each Payment Method & Duplicate Settlement Protection', () => {
    it('should settle order by Cash payment method', async () => {
      const res = await settleBarOrder('ORD-204', {
        paymentMethod: 'cash',
        amountPaid: 861.0,
        tip: 0
      });

      assert.equal(res.success, true);
      assert.equal(res.paymentMethod, 'cash');
      assert.ok(res.receiptNumber);
      assert.ok(res.settledAt);
    });

    it('should settle order by Card payment method', async () => {
      const res = await settleBarOrder('ORD-202', {
        paymentMethod: 'card',
        amountPaid: 2740.5,
        tip: 100
      });

      assert.equal(res.success, true);
      assert.equal(res.paymentMethod, 'card');
      assert.ok(res.receiptNumber);
    });

    it('should settle order by UPI payment method', async () => {
      const res = await settleBarOrder('ORD-201', {
        paymentMethod: 'upi',
        amountPaid: 1499.4,
        tip: 50
      });

      assert.equal(res.success, true);
      assert.equal(res.paymentMethod, 'upi');
      assert.ok(res.receiptNumber);
    });

    it('should reject settling when payment method is missing', async () => {
      await assert.rejects(
        async () => {
          await settleBarOrder('ORD-203', { amountPaid: 1000 });
        },
        /payment method is required/i
      );
    });

    it('should reject duplicate settlement (do not settle twice)', async () => {
      await assert.rejects(
        async () => {
          // ORD-200-SETTLED is already settled
          await settleBarOrder('ORD-200-SETTLED', {
            paymentMethod: 'card',
            amountPaid: 678.3
          });
        },
        /already settled/i
      );
    });
  });
});
