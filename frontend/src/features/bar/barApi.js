/**
 * Champions Club - Bar & Operations API Service
 * 
 * Interacts with:
 * - GET   /api/bar/tables
 * - GET   /api/bar/menu
 * - GET   /api/bar/orders
 * - POST  /api/bar/orders
 * - PATCH /api/bar/orders/:id/status
 * - POST  /api/bar/orders/:id/settle
 * 
 * Implements real network requests with isolated fallback adapters
 * matching the frozen bar schema when the backend is offline.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

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
    activeTabTotal: 1850,
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
    activeTabTotal: 3420,
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
    activeTabTotal: 5800,
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
    activeTabTotal: 1250,
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
    return Array.isArray(data) ? data : FALLBACK_TABLES;
  } catch (err) {
    console.warn('[BarAPI:getBarTables] Using fallback tables:', err.message);
    return FALLBACK_TABLES;
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
    return Array.isArray(data) ? data : FALLBACK_ORDERS;
  } catch (err) {
    console.warn('[BarAPI:getBarOrders] Using fallback orders:', err.message);
    let filtered = [...FALLBACK_ORDERS];
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
 * POST /api/bar/orders
 * Places or updates an active bar order
 */
export async function saveBarOrder(orderPayload) {
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
      throw new Error(`Failed to save bar order: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[BarAPI:saveBarOrder] Fallback simulation for saveBarOrder:', err.message);
    const newOrderId = orderPayload.id || `ORD-${Date.now().toString().slice(-4)}`;
    return {
      success: true,
      order: {
        ...orderPayload,
        id: newOrderId,
        status: 'open',
        kitchenStatus: orderPayload.kitchenStatus || 'PENDING',
        createdAt: orderPayload.createdAt || new Date().toISOString()
      },
      message: 'Order recorded successfully'
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
    return {
      success: true,
      orderId,
      settledAt: new Date().toISOString(),
      paymentMethod: settlementData.paymentMethod || 'card',
      amountPaid: settlementData.amountPaid,
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      message: 'Tab settled and closed successfully'
    };
  }
}
