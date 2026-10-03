/**
 * Champions Club - Bar & Operations API Service
 * Role: MEMBER 2 (Bar & Cafeteria POS, Tab Management, Kitchen Progression & Settlement)
 * 
 * Clean, robust implementation for table orders, menu, tabs, kitchen status, and settlement.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

// --- SEEDED REGISTERED CLUB MEMBERS ---
export const CLUB_MEMBERS = [
  { id: 'MEM-8801', name: 'Devon Conway', tier: 'Gold', discountPct: 15, active: true },
  { id: 'MEM-4920', name: 'Sarah Jenkins', tier: 'Silver', discountPct: 10, active: true },
  { id: 'MEM-1002', name: 'Rajesh Sharma', tier: 'Gold', discountPct: 15, active: true },
  { id: 'MEM-3120', name: 'Michael Chang', tier: 'Gold', discountPct: 15, active: true },
  { id: 'MEM-5510', name: 'Anita Desai', tier: 'Junior', discountPct: 10, active: true },
  { id: 'MEM-9004', name: 'Marcus Vance', tier: 'Silver', discountPct: 10, active: true }
];

// --- SEED TABLES ---
export const FALLBACK_TABLES = [
  { id: 'table-1', number: 1, name: 'Table 1 - Tennis Lounge', section: 'Lounge', capacity: 4, status: 'occupied', currentOrderId: 'ORD-201', activeTabTotal: 1499.4, memberId: 'MEM-8801', memberName: 'Devon Conway', membershipTier: 'Gold' },
  { id: 'table-2', number: 2, name: 'Table 2 - Courtside High-Top', section: 'Courtside', capacity: 2, status: 'available', currentOrderId: null, activeTabTotal: 0, memberId: null, memberName: null, membershipTier: null },
  { id: 'table-3', number: 3, name: 'Table 3 - Pavilion Terrace', section: 'Terrace', capacity: 6, status: 'open', currentOrderId: 'ORD-202', activeTabTotal: 2740.5, memberId: 'MEM-4920', memberName: 'Sarah Jenkins', membershipTier: 'Silver' },
  { id: 'table-4', number: 4, name: 'Table 4 - Central Bar Counter', section: 'Bar Counter', capacity: 2, status: 'available', currentOrderId: null, activeTabTotal: 0, memberId: null, memberName: null, membershipTier: null },
  { id: 'table-5', number: 5, name: 'Table 5 - VIP Players Booth', section: 'VIP Booth', capacity: 8, status: 'occupied', currentOrderId: 'ORD-203', activeTabTotal: 3677.1, memberId: 'MEM-1002', memberName: 'Rajesh Sharma', membershipTier: 'Gold' },
  { id: 'table-6', number: 6, name: 'Table 6 - Padel View Patio', section: 'Patio', capacity: 4, status: 'available', currentOrderId: null, activeTabTotal: 0, memberId: null, memberName: null, membershipTier: null },
  { id: 'table-7', number: 7, name: 'Table 7 - Cricket Pavilion High-Top', section: 'Pavilion', capacity: 4, status: 'available', currentOrderId: null, activeTabTotal: 0, memberId: null, memberName: null, membershipTier: null },
  { id: 'table-8', number: 8, name: 'Table 8 - Members Lounge Corner', section: 'Lounge', capacity: 6, status: 'open', currentOrderId: 'ORD-204', activeTabTotal: 861.0, memberId: null, memberName: 'Walk-in Guest', membershipTier: 'Guest' }
];

// --- SEED MENU ---
export const FALLBACK_MENU = [
  { id: 'bev-1', name: 'Champions Draft Craft Lager (500ml)', category: 'Beverages', price: 380, inStock: true, badge: 'On Tap', description: 'Crisp golden malt with subtle citrus hop aroma.' },
  { id: 'bev-2', name: 'Matchpoint Gin & Tonic Infusion', category: 'Beverages', price: 450, inStock: true, badge: 'Signature Cocktail', description: 'Artisanal gin, botanical elderflower tonic and cucumber ribbon.' },
  { id: 'bev-3', name: 'Fresh Hydration Cold-Pressed Juice', category: 'Beverages', price: 240, inStock: true, badge: 'Post-Workout', description: 'Valencia orange, carrot, fresh ginger and organic chia seeds.' },
  { id: 'bev-4', name: 'Double Espresso Tonic on Rocks', category: 'Beverages', price: 210, inStock: true, badge: 'Barista Pick', description: 'Single origin Arabica shot over tonic water and citrus twist.' },
  { id: 'bev-5', name: 'Electrolyte Coconut Recovery Cooler', category: 'Beverages', price: 220, inStock: true, badge: 'Zero Sugar', description: 'Tender coconut water, mint sprigs, lime zest and Himalayan salt.' },
  { id: 'bev-6', name: 'Smoky Single Malt (Glenfiddich 12)', category: 'Beverages', price: 580, inStock: true, badge: 'Premium Spirits', description: 'Rich sweet fruit notes with distinctive pear aroma.' },

  { id: 'food-1', name: 'Crispy Truffle Parmesan Fries', category: 'Food', price: 340, inStock: true, badge: 'Chef Special', description: 'Double cooked Yukon Gold potatoes tossed in white truffle oil.' },
  { id: 'food-2', name: 'Charcoal Grilled Chicken Tikka Platter', category: 'Food', price: 520, inStock: true, badge: 'Tandoor Classic', description: 'Marinated tender chicken chunks with mint chutney.' },
  { id: 'food-3', name: 'Classic Champions Club Sourdough Sandwich', category: 'Food', price: 460, inStock: true, badge: 'Club Staple', description: 'Smoked chicken breast, Monterey Jack cheese, fried egg and aioli.' },
  { id: 'food-4', name: 'Wild Mushroom & Burrata Woodfired Pizza', category: 'Food', price: 680, inStock: true, badge: 'Woodfired Oven', description: '48hr fermented sourdough base with cremini mushrooms and burrata.' },
  { id: 'food-5', name: 'Peri-Peri Crusted Crispy Calamari', category: 'Food', price: 490, inStock: true, badge: 'Seafood Bites', description: 'Golden tender squid rings dusted with house peri-peri seasoning.' },
  { id: 'food-6', name: 'Herb Paneer Shaslik Skewers', category: 'Food', price: 420, inStock: true, badge: 'Vegetarian', description: 'Cottage cheese cubes skewered with bell peppers and smoked paprika.' },

  { id: 'snack-1', name: 'Spiced Roasted Cashews & Almonds Mix', category: 'Snacks', price: 290, inStock: true, badge: 'Bar Crunch', description: 'Slow-roasted nuts with hand-ground cumin and pink rock salt.' },
  { id: 'snack-2', name: 'Loaded Nachos Grande with Fresh Guacamole', category: 'Snacks', price: 390, inStock: true, badge: 'Sharing Bowl', description: 'Warm corn chips topped with warm cheese sauce and jalapeños.' },
  { id: 'snack-3', name: 'Edamame with Sea Salt & Sesame Drizzle', category: 'Snacks', price: 320, inStock: true, badge: 'Healthy Nibbles', description: 'Steamed young soy pods sprinkled with toasted sesame oil.' },
  { id: 'snack-4', name: 'Crispy Veg Spring Rolls with Sweet Chilli Dip', category: 'Snacks', price: 310, inStock: true, badge: 'Popular Fingerfood', description: 'Golden fried vegetable wrappers stuffed with shredded cabbage.' }
];

// --- SEED ORDERS ---
const INITIAL_ORDERS = [
  {
    id: 'ORD-200-SETTLED',
    tableId: 'table-4',
    tableName: 'Table 4 - Central Bar Counter',
    status: 'settled',
    kitchenStatus: 'SERVED',
    memberId: 'MEM-3120',
    memberName: 'Michael Chang',
    membershipTier: 'Gold',
    discountPercentage: 15,
    items: [{ itemId: 'bev-1', name: 'Champions Draft Craft Lager (500ml)', quantity: 2, unitPrice: 380, price: 380 }],
    subtotal: 760,
    total: 678.3
  },
  {
    id: 'ORD-201',
    tableId: 'table-1',
    tableName: 'Table 1 - Tennis Lounge',
    status: 'open',
    kitchenStatus: 'PREPARING',
    memberId: 'MEM-8801',
    memberName: 'Devon Conway',
    membershipTier: 'Gold',
    discountPercentage: 15,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    items: [
      { itemId: 'bev-1', name: 'Champions Draft Craft Lager (500ml)', quantity: 2, unitPrice: 380, price: 380, notes: 'Extra chilled', kitchenStatus: 'PREPARING' },
      { itemId: 'food-1', name: 'Crispy Truffle Parmesan Fries', quantity: 1, unitPrice: 340, price: 340, notes: '', kitchenStatus: 'PREPARING' }
    ],
    subtotal: 1100,
    total: 1499.4
  },
  {
    id: 'ORD-202',
    tableId: 'table-3',
    tableName: 'Table 3 - Pavilion Terrace',
    status: 'open',
    kitchenStatus: 'READY',
    memberId: 'MEM-4920',
    memberName: 'Sarah Jenkins',
    membershipTier: 'Silver',
    discountPercentage: 10,
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    items: [
      { itemId: 'bev-2', name: 'Matchpoint Gin & Tonic Infusion', quantity: 3, unitPrice: 450, price: 450, notes: '', kitchenStatus: 'READY' }
    ],
    subtotal: 1350,
    total: 2740.5
  },
  {
    id: 'ORD-203',
    tableId: 'table-5',
    tableName: 'Table 5 - VIP Players Booth',
    status: 'open',
    kitchenStatus: 'PENDING',
    memberId: 'MEM-1002',
    memberName: 'Rajesh Sharma',
    membershipTier: 'Gold',
    discountPercentage: 15,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    items: [
      { itemId: 'food-4', name: 'Wild Mushroom & Burrata Woodfired Pizza', quantity: 2, unitPrice: 680, price: 680, notes: '', kitchenStatus: 'PENDING' }
    ],
    subtotal: 1360,
    total: 3677.1
  },
  {
    id: 'ORD-204',
    tableId: 'table-8',
    tableName: 'Table 8 - Members Lounge Corner',
    status: 'open',
    kitchenStatus: 'PENDING',
    memberId: null,
    memberName: 'Walk-in Guest',
    membershipTier: 'Guest',
    discountPercentage: 0,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    items: [
      { itemId: 'food-1', name: 'Crispy Truffle Parmesan Fries', quantity: 1, unitPrice: 340, price: 340, notes: '', kitchenStatus: 'PENDING' }
    ],
    subtotal: 820,
    total: 861.0
  }
];

// In-memory runtime state for offline mode
let inMemoryOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
let inMemoryTables = JSON.parse(JSON.stringify(FALLBACK_TABLES));

export function resetInMemoryBarState() {
  inMemoryOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  inMemoryTables = JSON.parse(JSON.stringify(FALLBACK_TABLES));
}

/**
 * Calculate totals with membership discount logic
 */
export function calculateOrderTotals(items = [], membershipTier = 'Guest', customDiscountPct = null) {
  let discountPct = 0;
  if (typeof customDiscountPct === 'number') {
    discountPct = customDiscountPct;
  } else {
    switch (membershipTier) {
      case 'Gold': discountPct = 15; break;
      case 'Silver': discountPct = 10; break;
      case 'Junior': discountPct = 10; break;
      default: discountPct = 0;
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice || item.price || 0) * (item.quantity || 1), 0);
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const tax = Math.round(discountedSubtotal * 0.05); // 5% GST
  const total = discountedSubtotal + tax;

  return { subtotal, discountPercentage: discountPct, discountAmount, tax, total };
}

/**
 * GET /api/bar/tables
 */
export async function getBarTables() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/tables`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : inMemoryTables;
  } catch {
    return inMemoryTables;
  }
}

/**
 * GET /api/bar/menu
 */
export async function getBarMenu(category = '') {
  try {
    const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/bar/menu${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : FALLBACK_MENU;
  } catch {
    if (!category || category === 'All') return FALLBACK_MENU;
    return FALLBACK_MENU.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }
}

/**
 * GET /api/bar/orders
 */
export async function getBarOrders(tableId = '', status = '') {
  try {
    const params = new URLSearchParams();
    if (tableId) params.append('tableId', tableId);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_BASE_URL}/api/bar/orders${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : inMemoryOrders;
  } catch {
    let list = [...inMemoryOrders];
    if (tableId) list = list.filter((o) => o.tableId === tableId);
    if (status) list = list.filter((o) => o.status === status);
    return list;
  }
}

/**
 * Member identification lookup
 */
export async function lookupMember(query) {
  if (!query || !query.trim()) {
    return { valid: false, error: 'Member query cannot be empty' };
  }

  const clean = query.trim().toUpperCase();
  const member = CLUB_MEMBERS.find((m) => m.id.toUpperCase() === clean || m.name.toUpperCase().includes(clean));

  if (!member) {
    return { valid: false, error: `Member '${query}' not found. Standard guest pricing applied.` };
  }

  return { valid: true, member };
}

/**
 * POST /api/bar/orders - Create or open tab
 */
export async function createBarOrder(orderPayload) {
  if (!orderPayload.tableId) {
    throw new Error('Validation Error: Selected table is required to open a tab.');
  }

  const existing = inMemoryOrders.find((o) => o.tableId === orderPayload.tableId && o.status === 'open');
  if (existing && orderPayload.id !== existing.id) {
    const err = new Error(`Table is already in active use with open tab #${existing.id}.`);
    err.code = 'TABLE_ALREADY_ACTIVE';
    throw err;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, order: data.order || data };
  } catch {
    const orderId = orderPayload.id || `ORD-${Date.now().toString().slice(-4)}`;
    const items = orderPayload.items || [];
    const totals = calculateOrderTotals(items, orderPayload.membershipTier || 'Guest', orderPayload.discountPercentage);

    const created = {
      ...orderPayload,
      ...totals,
      id: orderId,
      status: 'open',
      kitchenStatus: orderPayload.kitchenStatus || 'PENDING',
      createdAt: orderPayload.createdAt || new Date().toISOString()
    };

    inMemoryOrders.unshift(created);

    const table = inMemoryTables.find((t) => t.id === orderPayload.tableId);
    if (table) {
      table.status = 'open';
      table.currentOrderId = orderId;
      table.activeTabTotal = created.total;
    }

    return { success: true, order: created };
  }
}

/**
 * POST /api/bar/orders/:id/items - Add items to existing tab
 */
export async function addItemsToBarOrder(orderId, newItems = []) {
  if (!Array.isArray(newItems) || newItems.length === 0) {
    throw new Error('Items array is required');
  }

  for (const item of newItems) {
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Quantity must be a positive integer for item ${item.name || ''}`);
    }
  }

  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (order && order.status === 'settled') {
    throw new Error('Cannot add items to an already-settled bar order tab');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newItems })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, order: data.order || data };
  } catch (err) {
    if (err.message.includes('positive integer') || err.message.includes('already-settled')) {
      throw err;
    }
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.items = [...order.items, ...newItems.map((i) => ({ ...i, kitchenStatus: 'PENDING' }))];
    const totals = calculateOrderTotals(order.items, order.membershipTier, order.discountPercentage);
    Object.assign(order, totals);

    return { success: true, order };
  }
}

/**
 * PATCH /api/bar/orders/:id/items/:itemId - Update item quantity or notes
 */
export async function updateBarOrderItem(orderId, itemId, updates = {}) {
  if (updates.quantity !== undefined && updates.quantity <= 0) {
    throw new Error('Item quantity must be a positive integer');
  }

  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (order && order.status === 'settled') {
    throw new Error('Cannot modify an already-settled order');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, order: data.order || data };
  } catch (err) {
    if (err.message.includes('positive integer') || err.message.includes('already-settled')) {
      throw err;
    }
    if (!order) throw new Error(`Order ${orderId} not found`);

    const targetItem = order.items.find((i) => i.itemId === itemId || i.id === itemId);
    if (!targetItem) throw new Error(`Item ${itemId} not found in order`);

    Object.assign(targetItem, updates);
    const totals = calculateOrderTotals(order.items, order.membershipTier, order.discountPercentage);
    Object.assign(order, totals);

    return { success: true, order };
  }
}

/**
 * PATCH /api/bar/orders/:id/status - Update kitchen progression status
 */
export async function updateKitchenStatus(orderId, status) {
  const normalized = (status || 'PENDING').toUpperCase();

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: normalized })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const order = inMemoryOrders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.kitchenStatus = normalized;
    order.items = order.items.map((i) => ({ ...i, kitchenStatus: normalized }));
    return order;
  }
}

/**
 * POST /api/bar/orders/:id/settle - Settle bill tab
 */
export async function settleBarOrder(orderId, settlementData = {}) {
  if (!settlementData.paymentMethod) {
    throw new Error('Payment method is required to settle order');
  }

  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }
  if (order.status === 'settled') {
    throw new Error('Order is already settled. Duplicate settlement not allowed.');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settlementData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.message.includes('Payment method') || err.message.includes('already settled')) {
      throw err;
    }

    order.status = 'settled';
    order.kitchenStatus = 'SERVED';
    order.settledAt = new Date().toISOString();
    order.paymentMethod = settlementData.paymentMethod;
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

    const table = inMemoryTables.find((t) => t.id === order.tableId);
    if (table) {
      table.status = 'available';
      table.currentOrderId = null;
      table.activeTabTotal = 0;
    }

    return {
      success: true,
      order,
      paymentMethod: order.paymentMethod,
      receiptNumber,
      settledAt: order.settledAt,
      message: 'Tab settled successfully'
    };
  }
}
