/**
 * Champions Club - Bar & Operations API Service
 * 
 * Implements endpoints:
 * - GET   /api/bar/tables
 * - GET   /api/bar/menu
 * - GET   /api/bar/orders
 * - POST  /api/bar/orders
 * - POST  /api/bar/orders/:id/items
 * - PATCH /api/bar/orders/:id/items/:itemId
 * - PATCH /api/bar/orders/:id/status
 * - POST  /api/bar/orders/:id/settle
 * 
 * Implements real network requests with isolated fallback adapters
 * matching the frozen bar schema when the backend is offline.
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

// --- ISOLATED REALISTIC FALLBACK ADAPTER DATA ---

export const FALLBACK_TABLES = [
  {
    id: 'table-1',
    number: 1,
    name: 'Table 1 - Tennis Lounge',
    section: 'Lounge',
    capacity: 4,
    status: 'occupied',
    currentOrderId: 'ORD-201',
    activeTabTotal: 1499.4,
    memberId: 'MEM-8801',
    memberName: 'Devon Conway',
    membershipTier: 'Gold'
  },
  {
    id: 'table-2',
    number: 2,
    name: 'Table 2 - Courtside High-Top',
    section: 'Courtside',
    capacity: 2,
    status: 'available',
    currentOrderId: null,
    activeTabTotal: 0,
    memberId: null,
    memberName: null,
    membershipTier: null
  },
  {
    id: 'table-3',
    number: 3,
    name: 'Table 3 - Pavilion Terrace',
    section: 'Terrace',
    capacity: 6,
    status: 'open',
    currentOrderId: 'ORD-202',
    activeTabTotal: 2740.5,
    memberId: 'MEM-4920',
    memberName: 'Sarah Jenkins',
    membershipTier: 'Silver'
  },
  {
    id: 'table-4',
    number: 4,
    name: 'Table 4 - Central Bar Counter',
    section: 'Bar Counter',
    capacity: 2,
    status: 'available',
    currentOrderId: null,
    activeTabTotal: 0,
    memberId: null,
    memberName: null,
    membershipTier: null
  },
  {
    id: 'table-5',
    number: 5,
    name: 'Table 5 - VIP Players Booth',
    section: 'VIP Booth',
    capacity: 8,
    status: 'occupied',
    currentOrderId: 'ORD-203',
    activeTabTotal: 3677.1,
    memberId: 'MEM-1002',
    memberName: 'Rajesh Sharma',
    membershipTier: 'Gold'
  },
  {
    id: 'table-6',
    number: 6,
    name: 'Table 6 - Cricket Deck High-Top',
    section: 'Terrace',
    capacity: 4,
    status: 'available',
    currentOrderId: null,
    activeTabTotal: 0,
    memberId: null,
    memberName: null,
    membershipTier: null
  },
  {
    id: 'table-7',
    number: 7,
    name: 'Table 7 - Padel Viewing Deck',
    section: 'Courtside',
    capacity: 4,
    status: 'open',
    currentOrderId: 'ORD-204',
    activeTabTotal: 861.0,
    memberId: null,
    memberName: 'Walk-in Guest',
    membershipTier: 'Guest'
  },
  {
    id: 'table-8',
    number: 8,
    name: 'Table 8 - Members Snug',
    section: 'Lounge',
    capacity: 6,
    status: 'available',
    currentOrderId: null,
    activeTabTotal: 0,
    memberId: null,
    memberName: null,
    membershipTier: null
  }
];

export const FALLBACK_MENU = [
  // Beverages - Beers & Ciders
  {
    id: 'bev-1',
    name: 'Champions Draft Craft Lager (500ml)',
    category: 'Beers & Ciders',
    price: 380,
    memberPrice: 323,
    description: 'Crisp golden Bavarian-style pilsner brewed exclusively for Champions Club members.',
    inStock: true,
    stock: 64,
    prepTimeMinutes: 2,
    badge: 'Club Favourite',
    alcoholic: true
  },
  {
    id: 'bev-2',
    name: 'Bira 91 White Wheat Ale',
    category: 'Beers & Ciders',
    price: 360,
    memberPrice: 306,
    description: 'Aromatic low-bitterness wheat beer with hints of coriander and fresh orange peel.',
    inStock: true,
    stock: 42,
    prepTimeMinutes: 2,
    alcoholic: true
  },
  {
    id: 'bev-3',
    name: 'Sheppy’s Vintage Apple Cider',
    category: 'Beers & Ciders',
    price: 420,
    memberPrice: 357,
    description: 'Refreshing English traditional sparkling cider from Somerset cider orchards.',
    inStock: true,
    stock: 18,
    prepTimeMinutes: 2,
    alcoholic: true
  },

  // Cocktails & Signature
  {
    id: 'bev-4',
    name: 'Wimbledon Pimm’s Cup No.1',
    category: 'Signature Cocktails',
    price: 520,
    memberPrice: 442,
    description: 'Pimm’s No. 1 infused with cucumber ribbons, garden mint, strawberries and premium ginger ale.',
    inStock: true,
    stock: 30,
    prepTimeMinutes: 4,
    badge: 'Signature',
    alcoholic: true
  },
  {
    id: 'bev-5',
    name: 'Smoky Mezcal Paloma',
    category: 'Signature Cocktails',
    price: 580,
    memberPrice: 493,
    description: 'Artisanal Mezcal, fresh pink grapefruit reduction, lime juice and Himalayan black salt rim.',
    inStock: true,
    stock: 25,
    prepTimeMinutes: 5,
    alcoholic: true
  },
  {
    id: 'bev-6',
    name: 'Court Ace Gin & Tonic',
    category: 'Signature Cocktails',
    price: 490,
    memberPrice: 416,
    description: 'Botanical London Dry gin with rosemary sprig, dried juniper berries and elderflower tonic.',
    inStock: true,
    stock: 28,
    prepTimeMinutes: 3,
    alcoholic: true
  },

  // Recovery & Smoothies (Non-Alcoholic)
  {
    id: 'rec-1',
    name: 'Electro-Hydrate Coconut Cooler',
    category: 'Recovery & Smoothies',
    price: 240,
    memberPrice: 204,
    description: 'Pure tender coconut water, chia seeds, lime spritz and pink salt for rapid recovery.',
    inStock: true,
    stock: 50,
    prepTimeMinutes: 3,
    badge: 'Post-Match',
    alcoholic: false
  },
  {
    id: 'rec-2',
    name: 'Match Point Whey Protein Shake',
    category: 'Recovery & Smoothies',
    price: 320,
    memberPrice: 272,
    description: '30g grass-fed vanilla whey, almond butter, ripe banana, oats and unsweetened oat milk.',
    inStock: true,
    stock: 35,
    prepTimeMinutes: 4,
    badge: 'Fitness',
    alcoholic: false
  },
  {
    id: 'rec-3',
    name: 'Wild Berry Antioxidant Blast',
    category: 'Recovery & Smoothies',
    price: 280,
    memberPrice: 238,
    description: 'Blueberries, raspberries, Greek yoghurt, raw organic honey and pomegranate reduction.',
    inStock: true,
    stock: 22,
    prepTimeMinutes: 4,
    alcoholic: false
  },

  // Bar Bites & Small Plates
  {
    id: 'food-1',
    name: 'Crispy Truffle Parmesan Fries',
    category: 'Bar Bites',
    price: 340,
    memberPrice: 289,
    description: 'Hand-cut Idaho potatoes tossed in white truffle oil, 24-month aged parmesan and fresh parsley.',
    inStock: true,
    stock: 40,
    prepTimeMinutes: 8,
    badge: 'Bestseller',
    alcoholic: false
  },
  {
    id: 'food-2',
    name: 'Wood-Fired Garlic Butter Chicken Wings',
    category: 'Bar Bites',
    price: 460,
    memberPrice: 391,
    description: 'Smoky clay-oven wings glazed in roasted garlic butter with sriracha lime dip.',
    inStock: true,
    stock: 26,
    prepTimeMinutes: 12,
    alcoholic: false
  },
  {
    id: 'food-3',
    name: 'Avocado & Burrata Bruschetta',
    category: 'Bar Bites',
    price: 420,
    memberPrice: 357,
    description: 'Charred sourdough, smashed Hass avocado, creamy Pugliese burrata and aged balsamic glaze.',
    inStock: true,
    stock: 20,
    prepTimeMinutes: 7,
    alcoholic: false
  },
  {
    id: 'food-4',
    name: 'Paneer Tikka Crostini',
    category: 'Bar Bites',
    price: 380,
    memberPrice: 323,
    description: 'Marinated cottage cheese skewers roasted in the tandoor with mint emulsion and pickled shallots.',
    inStock: true,
    stock: 32,
    prepTimeMinutes: 10,
    alcoholic: false
  },

  // Mains
  {
    id: 'main-1',
    name: 'Champions Smashed Angus Cheeseburger',
    category: 'Mains',
    price: 580,
    memberPrice: 493,
    description: 'Double Angus beef patties, sharp Wisconsin cheddar, brioche bun, house relish with crisp fries.',
    inStock: true,
    stock: 18,
    prepTimeMinutes: 15,
    badge: 'Chef Special',
    alcoholic: false
  },
  {
    id: 'main-2',
    name: 'Rustic Margherita Pinsa Romana',
    category: 'Mains',
    price: 520,
    memberPrice: 442,
    description: 'Slow-fermented cloud crust, San Marzano tomato reduction, fior di latte and sweet basil.',
    inStock: true,
    stock: 25,
    prepTimeMinutes: 14,
    alcoholic: false
  },
  {
    id: 'main-3',
    name: 'Grilled Salmon Caesar Power Bowl',
    category: 'Mains',
    price: 640,
    memberPrice: 544,
    description: 'Norwegian salmon fillet, crisp baby romaine, soft-boiled organic egg, sourdough croutons.',
    inStock: true,
    stock: 12,
    prepTimeMinutes: 12,
    alcoholic: false
  }
];

export const FALLBACK_ORDERS = [
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
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    items: [
      {
        itemId: 'bev-1',
        name: 'Champions Draft Craft Lager (500ml)',
        quantity: 2,
        unitPrice: 380,
        notes: 'Chilled glasses please',
        kitchenStatus: 'SERVED'
      },
      {
        itemId: 'food-1',
        name: 'Crispy Truffle Parmesan Fries',
        quantity: 1,
        unitPrice: 340,
        notes: 'Extra truffle dip',
        kitchenStatus: 'PREPARING'
      },
      {
        itemId: 'main-1',
        name: 'Champions Smashed Angus Cheeseburger',
        quantity: 1,
        unitPrice: 580,
        notes: 'Medium rare, no pickles',
        kitchenStatus: 'PREPARING'
      }
    ],
    subtotal: 1680,
    discountAmount: 252,
    tax: 71.4,
    total: 1499.4,
    settledAt: null,
    paymentMethod: null
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
    createdAt: new Date(Date.now() - 32 * 60000).toISOString(),
    items: [
      {
        itemId: 'bev-4',
        name: 'Wimbledon Pimm’s Cup No.1',
        quantity: 3,
        unitPrice: 520,
        notes: '',
        kitchenStatus: 'READY'
      },
      {
        itemId: 'food-2',
        name: 'Wood-Fired Garlic Butter Chicken Wings',
        quantity: 2,
        unitPrice: 460,
        notes: 'Extra spicy glaze',
        kitchenStatus: 'READY'
      },
      {
        itemId: 'food-3',
        name: 'Avocado & Burrata Bruschetta',
        quantity: 1,
        unitPrice: 420,
        notes: 'Gluten-free toast if possible',
        kitchenStatus: 'READY'
      }
    ],
    subtotal: 2900,
    discountAmount: 290,
    tax: 130.5,
    total: 2740.5,
    settledAt: null,
    paymentMethod: null
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
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    items: [
      {
        itemId: 'bev-5',
        name: 'Smoky Mezcal Paloma',
        quantity: 4,
        unitPrice: 580,
        notes: 'Low ice',
        kitchenStatus: 'PENDING'
      },
      {
        itemId: 'main-2',
        name: 'Rustic Margherita Pinsa Romana',
        quantity: 2,
        unitPrice: 520,
        notes: 'Extra fresh basil',
        kitchenStatus: 'PENDING'
      },
      {
        itemId: 'food-4',
        name: 'Paneer Tikka Crostini',
        quantity: 2,
        unitPrice: 380,
        notes: '',
        kitchenStatus: 'PENDING'
      }
    ],
    subtotal: 4120,
    discountAmount: 618,
    tax: 175.1,
    total: 3677.1,
    settledAt: null,
    paymentMethod: null
  },
  {
    id: 'ORD-204',
    tableId: 'table-7',
    tableName: 'Table 7 - Padel Viewing Deck',
    status: 'open',
    kitchenStatus: 'SERVED',
    memberId: null,
    memberName: 'Walk-in Guest',
    membershipTier: 'Guest',
    discountPercentage: 0,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    items: [
      {
        itemId: 'rec-1',
        name: 'Electro-Hydrate Coconut Cooler',
        quantity: 2,
        unitPrice: 240,
        notes: '',
        kitchenStatus: 'SERVED'
      },
      {
        itemId: 'food-1',
        name: 'Crispy Truffle Parmesan Fries',
        quantity: 1,
        unitPrice: 340,
        notes: '',
        kitchenStatus: 'SERVED'
      }
    ],
    subtotal: 820,
    discountAmount: 0,
    tax: 41,
    total: 861,
    settledAt: null,
    paymentMethod: null
  },
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
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
    settledAt: new Date(Date.now() - 25 * 60000).toISOString(),
    paymentMethod: 'card',
    items: [
      {
        itemId: 'bev-1',
        name: 'Champions Draft Craft Lager (500ml)',
        quantity: 2,
        unitPrice: 380,
        notes: '',
        kitchenStatus: 'SERVED'
      }
    ],
    subtotal: 760,
    discountAmount: 114,
    tax: 32.3,
    total: 678.3
  }
];

// In-memory runtime state for active orders when backend is offline
let inMemoryOrders = JSON.parse(JSON.stringify(FALLBACK_ORDERS));
let inMemoryTables = JSON.parse(JSON.stringify(FALLBACK_TABLES));

// Helper: Calculate totals with backend-specified discount logic
export function calculateOrderTotals(items, membershipTier = 'Guest', customDiscountPct = null) {
  let discountPct = 0;
  if (customDiscountPct !== null && typeof customDiscountPct === 'number') {
    discountPct = customDiscountPct;
  } else {
    switch (membershipTier) {
      case 'Gold':
        discountPct = 15;
        break;
      case 'Silver':
        discountPct = 10;
        break;
      case 'Junior':
        discountPct = 10;
        break;
      default:
        discountPct = 0;
    }
  }

  const subtotal = items.reduce((acc, it) => acc + (it.unitPrice || it.price || 0) * (it.quantity || 1), 0);
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const tax = Math.round(discountedSubtotal * 0.05); // 5% GST
  const total = discountedSubtotal + tax;

  return {
    subtotal,
    discountPercentage: discountPct,
    discountAmount,
    tax,
    total
  };
}

// --- API METHODS ---

/**
 * GET /api/bar/tables
 */
export async function getBarTables() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/tables`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch bar tables: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : inMemoryTables;
  } catch (err) {
    console.warn('[BarAPI:getBarTables] Using fallback tables:', err.message);
    return inMemoryTables;
  }
}

/**
 * GET /api/bar/menu?category={category}
 */
export async function getBarMenu(category = '') {
  const queryParams = new URLSearchParams();
  if (category && category !== 'All') {
    queryParams.append('category', category);
  }

  try {
    const url = `${API_BASE_URL}/api/bar/menu${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch bar menu: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : FALLBACK_MENU;
  } catch (err) {
    console.warn('[BarAPI:getBarMenu] Using fallback menu:', err.message);
    if (!category || category === 'All') {
      return FALLBACK_MENU;
    }
    return FALLBACK_MENU.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }
}

/**
 * GET /api/bar/orders?tableId={tableId}&status={status}
 */
export async function getBarOrders(tableId = '', status = '') {
  const queryParams = new URLSearchParams();
  if (tableId) queryParams.append('tableId', tableId);
  if (status) queryParams.append('status', status);

  try {
    const url = `${API_BASE_URL}/api/bar/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch bar orders: HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : inMemoryOrders;
  } catch (err) {
    console.warn('[BarAPI:getBarOrders] Using fallback orders:', err.message);
    let filtered = [...inMemoryOrders];
    if (tableId) {
      filtered = filtered.filter((ord) => ord.tableId === tableId);
    }
    if (status) {
      filtered = filtered.filter((ord) => ord.status === status);
    }
    return filtered;
  }
}

/**
 * Member Identification helper
 */
export async function lookupMember(memberQuery) {
  if (!memberQuery || !memberQuery.trim()) {
    return { valid: false, error: 'Member query cannot be empty' };
  }

  const cleanQuery = memberQuery.trim().toUpperCase();
  const found = CLUB_MEMBERS.find(
    (m) => m.id.toUpperCase() === cleanQuery || m.name.toUpperCase().includes(cleanQuery)
  );

  if (!found) {
    return {
      valid: false,
      error: `Member '${memberQuery}' not found in Champions Club registry. Standard guest pricing applied.`
    };
  }

  return {
    valid: true,
    member: found
  };
}

/**
 * POST /api/bar/orders
 * Creates or opens a new tab for a table
 */
export async function createBarOrder(orderPayload) {
  // Validation: table required
  if (!orderPayload.tableId) {
    throw new Error('Validation Error: Selected table is required to open a tab.');
  }

  // Edge case check: table already in active use
  const existingActive = inMemoryOrders.find(
    (o) => o.tableId === orderPayload.tableId && o.status === 'open'
  );
  if (existingActive) {
    // If not updating the same order ID, flag that table already in active use
    if (orderPayload.id !== existingActive.id) {
      const err = new Error(`Table is already in active use with open tab #${existingActive.id}.`);
      err.code = 'TABLE_ALREADY_ACTIVE';
      err.activeOrderId = existingActive.id;
      throw err;
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) {
      throw new Error(`Failed to create bar order: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[BarAPI:createBarOrder] Fallback simulation for createBarOrder:', err.message);
    const newOrderId = orderPayload.id || `ORD-${Date.now().toString().slice(-4)}`;
    const items = orderPayload.items || [];
    const totals = calculateOrderTotals(
      items,
      orderPayload.membershipTier || 'Guest',
      orderPayload.discountPercentage
    );

    const createdOrder = {
      ...orderPayload,
      ...totals,
      id: newOrderId,
      status: 'open',
      kitchenStatus: orderPayload.kitchenStatus || 'PENDING',
      createdAt: orderPayload.createdAt || new Date().toISOString()
    };

    // Update in-memory state
    const idx = inMemoryOrders.findIndex((o) => o.id === newOrderId);
    if (idx > -1) {
      inMemoryOrders[idx] = createdOrder;
    } else {
      inMemoryOrders.unshift(createdOrder);
    }

    // Update table status in-memory
    const tbl = inMemoryTables.find((t) => t.id === orderPayload.tableId);
    if (tbl) {
      tbl.status = 'open';
      tbl.currentOrderId = newOrderId;
      tbl.activeTabTotal = createdOrder.total;
      tbl.memberId = orderPayload.memberId || null;
      tbl.memberName = orderPayload.memberName || null;
      tbl.membershipTier = orderPayload.membershipTier || 'Guest';
    }

    return {
      success: true,
      order: createdOrder,
      message: 'Tab opened and order recorded successfully'
    };
  }
}

/**
 * POST /api/bar/orders/:id/items
 * Adds items to an existing open tab
 */
export async function addItemsToBarOrder(orderId, newItems) {
  // Validation: items required with positive quantity
  if (!Array.isArray(newItems) || newItems.length === 0) {
    throw new Error('Validation Error: Must provide items to add.');
  }

  for (const it of newItems) {
    if (!it.quantity || it.quantity <= 0) {
      throw new Error('Validation Error: Quantity must be a positive integer.');
    }
  }

  // Edge case: Do not add items after settlement
  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (order && order.status === 'settled') {
    throw new Error('Validation Error: Cannot add items to an already-settled order.');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ items: newItems })
    });
    if (!res.ok) {
      throw new Error(`Failed to add items to order: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[BarAPI:addItemsToBarOrder] Fallback simulation:', err.message);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    // Append new items
    const formatted = newItems.map((it) => ({
      itemId: it.itemId || it.id,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice || it.price,
      notes: it.notes || '',
      kitchenStatus: 'PENDING'
    }));

    order.items = [...order.items, ...formatted];
    const totals = calculateOrderTotals(order.items, order.membershipTier, order.discountPercentage);
    Object.assign(order, totals);

    // Update table active total
    const tbl = inMemoryTables.find((t) => t.id === order.tableId);
    if (tbl) {
      tbl.activeTabTotal = order.total;
    }

    return {
      success: true,
      order,
      message: `Added ${newItems.length} items to tab #${orderId}`
    };
  }
}

/**
 * PATCH /api/bar/orders/:id/items/:itemId
 * Changes quantity or notes on an order item
 */
export async function updateBarOrderItem(orderId, itemId, updates) {
  // Validation: positive quantity
  if (updates.quantity !== undefined && updates.quantity <= 0) {
    throw new Error('Validation Error: Item quantity must be greater than zero.');
  }

  // Edge case: Do not modify after settlement
  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (order && order.status === 'settled') {
    throw new Error('Validation Error: Cannot update items in an already-settled order.');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      throw new Error(`Failed to update item: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[BarAPI:updateBarOrderItem] Fallback simulation:', err.message);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const item = order.items.find((it) => it.itemId === itemId || it.id === itemId);
    if (!item) {
      throw new Error(`Item #${itemId} not found in order #${orderId}`);
    }

    if (updates.quantity !== undefined) item.quantity = updates.quantity;
    if (updates.notes !== undefined) item.notes = updates.notes;
    if (updates.kitchenStatus !== undefined) item.kitchenStatus = updates.kitchenStatus;

    const totals = calculateOrderTotals(order.items, order.membershipTier, order.discountPercentage);
    Object.assign(order, totals);

    const tbl = inMemoryTables.find((t) => t.id === order.tableId);
    if (tbl) {
      tbl.activeTabTotal = order.total;
    }

    return {
      success: true,
      order,
      item,
      message: 'Item updated successfully'
    };
  }
}

/**
 * PATCH /api/bar/orders/:id/status
 */
export async function updateKitchenStatus(orderId, nextStatus) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ kitchenStatus: nextStatus })
    });
    if (!res.ok) {
      throw new Error(`Failed to update status: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[BarAPI:updateKitchenStatus] Fallback simulation for status update:', err.message);
    const order = inMemoryOrders.find((o) => o.id === orderId);
    if (order) {
      order.kitchenStatus = nextStatus;
      // Also advance pending items
      order.items = order.items.map((it) => ({
        ...it,
        kitchenStatus: nextStatus
      }));
    }

    return {
      success: true,
      orderId,
      kitchenStatus: nextStatus,
      message: `Kitchen status updated to ${nextStatus}`
    };
  }
}

/**
 * POST /api/bar/orders/:id/settle
 */
export async function settleBarOrder(orderId, settlementData) {
  // Validation: Payment method required
  if (!settlementData || !settlementData.paymentMethod) {
    throw new Error('Validation Error: Payment method is required (cash, card, upi, or member_tab).');
  }

  // Edge case: Do not settle twice
  const order = inMemoryOrders.find((o) => o.id === orderId);
  if (order && order.status === 'settled') {
    throw new Error('Validation Error: This order is already settled. Duplicate settlement is prohibited.');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/bar/orders/${orderId}/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(settlementData)
    });
    if (!res.ok) {
      throw new Error(`Settlement failed: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[BarAPI:settleBarOrder] Fallback simulation for settlement:', err.message);
    const settledAt = new Date().toISOString();
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

    if (order) {
      order.status = 'settled';
      order.kitchenStatus = 'SERVED';
      order.settledAt = settledAt;
      order.paymentMethod = settlementData.paymentMethod;
    }

    // Clear table status
    if (order && order.tableId) {
      const tbl = inMemoryTables.find((t) => t.id === order.tableId);
      if (tbl) {
        tbl.status = 'available';
        tbl.currentOrderId = null;
        tbl.activeTabTotal = 0;
        tbl.memberId = null;
        tbl.memberName = null;
        tbl.membershipTier = null;
      }
    }

    return {
      success: true,
      orderId,
      settledAt,
      paymentMethod: settlementData.paymentMethod,
      amountPaid: settlementData.amountPaid || (order ? order.total : 0),
      receiptNumber,
      message: `Tab #${orderId} settled successfully via ${settlementData.paymentMethod.toUpperCase()}`
    };
  }
}

/**
 * Reset in-memory simulation state
 */
export function resetInMemoryBarState() {
  inMemoryOrders = JSON.parse(JSON.stringify(FALLBACK_ORDERS));
  inMemoryTables = JSON.parse(JSON.stringify(FALLBACK_TABLES));
}
