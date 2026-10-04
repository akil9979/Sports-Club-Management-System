/**
 * Champions Club - Shop & Online Ordering API Client
 * Role: MEMBER 1 (Member Experience & Shop Flow)
 * 
 * Endpoints:
 * - GET  /api/products
 * - GET  /api/products/:id
 * - POST /api/shop/orders
 * - GET  /api/shop/orders
 * - GET  /api/shop/orders/:id
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

const CART_STORAGE_KEY = 'champions_club_shop_cart';
const TOKEN_KEY = 'champions_club_auth_token';

// Safe storage accessor
function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (!globalThis.__mockLocalStorage) {
    globalThis.__mockLocalStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; }
    };
  }
  return globalThis.__mockLocalStorage;
}

function getAuthToken() {
  return getStorage().getItem(TOKEN_KEY);
}

// Fallback products matching canonical seed database
export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Head Speed Pro 2026 Tennis Racket',
    categoryId: 'cat-rackets',
    category: 'Rackets',
    sportId: 'sport-tennis',
    sport: 'Tennis',
    sku: 'PROD-HEAD-SPEED-2026',
    price: 15499.00,
    memberPrice: 12399.00,
    rating: 4.9,
    badge: 'Best Seller',
    description: 'Engineered for fast-swinging tournament players seeking razor-sharp control and effortless spin.',
    imageUrl: 'https://images.unsplash.com/photo-1617083934555-ac7d4fed8889?w=600&auto=format&fit=crop&q=80',
    stock: 8,
    inStock: true,
    isLowStock: false,
    isActive: true
  },
  {
    id: 'prod-2',
    name: 'Wilson US Open Extra Duty Tennis Balls (Can of 4)',
    categoryId: 'cat-balls',
    category: 'Balls',
    sportId: 'sport-tennis',
    sport: 'Tennis',
    sku: 'PROD-WILSON-USOPEN-4',
    price: 699.00,
    memberPrice: 559.00,
    rating: 4.8,
    badge: 'Official Ball',
    description: 'The standard of excellence for hard courts. Premium woven felt provides unmatched durability and true flight.',
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop&q=80',
    stock: 45,
    inStock: true,
    isLowStock: false,
    isActive: true
  },
  {
    id: 'prod-3',
    name: 'Asics Gel-Resolution 9 All-Court Shoes',
    categoryId: 'cat-shoes',
    category: 'Shoes',
    sportId: 'sport-tennis',
    sport: 'Tennis & Padel',
    sku: 'PROD-ASICS-GEL-RES9',
    price: 11499.00,
    memberPrice: 9199.00,
    rating: 4.9,
    badge: 'Top Pick',
    description: 'Featuring DYNAWALL lateral stability and full-length FLYTEFOAM cushioning for explosive footwork.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    stock: 6,
    inStock: true,
    isLowStock: false,
    isActive: true
  },
  {
    id: 'prod-4',
    name: 'SS Ton Reserve Edition English Willow Bat',
    categoryId: 'cat-cricket',
    category: 'Cricket',
    sportId: 'sport-cricket',
    sport: 'Cricket',
    sku: 'PROD-SSTON-RESERVE',
    price: 19999.00,
    memberPrice: 15999.00,
    rating: 5.0,
    badge: 'Pro Grade',
    description: 'Grade 1 air-dried English Willow with massive contoured edges, 8-10 straight grains and featherlight balance.',
    imageUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=600&auto=format&fit=crop&q=80',
    stock: 3,
    inStock: true,
    isLowStock: true,
    isActive: true
  },
  {
    id: 'prod-5',
    name: 'Babolat RH12 Pure Aero Championship Bag',
    categoryId: 'cat-accessories',
    category: 'Accessories',
    sportId: 'sport-tennis',
    sport: 'Tennis',
    sku: 'PROD-BABOLAT-RH12',
    price: 9299.00,
    memberPrice: 7439.00,
    rating: 4.7,
    badge: 'Out of Stock',
    description: 'Holds up to 12 rackets in temperature-shielded thermal compartments. Includes ventilated wet gear pouch.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    stock: 0,
    inStock: false,
    isLowStock: false,
    isActive: true
  },
  {
    id: 'prod-6',
    name: 'Babolat RPM Blast 1.25mm String + Express Stringing',
    categoryId: 'cat-accessories',
    category: 'Accessories',
    sportId: 'sport-tennis',
    sport: 'Tennis',
    sku: 'PROD-RPM-BLAST-STR',
    price: 1699.00,
    memberPrice: 1359.00,
    rating: 4.9,
    badge: 'In-House Service',
    description: 'Maximum topspin and snap-back with octagonal profile. Includes instant restringing at our club pro shop desk.',
    imageUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80',
    stock: 22,
    inStock: true,
    isLowStock: false,
    isActive: true
  },
  {
    id: 'prod-7',
    name: 'Bullpadel Vertex 03 Diamond Padel Racket',
    categoryId: 'cat-rackets',
    category: 'Rackets',
    sportId: 'sport-padel',
    sport: 'Padel',
    sku: 'PROD-BULLPADEL-VTX3',
    price: 18999.00,
    memberPrice: 15199.00,
    rating: 4.8,
    badge: 'WPT Choice',
    description: 'Diamond shape for maximum power. Multi-EVA core and Xtend Carbon 12K surface for superior touch.',
    imageUrl: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=600&auto=format&fit=crop&q=80',
    stock: 5,
    inStock: true,
    isLowStock: true,
    isActive: true
  },
  {
    id: 'prod-8',
    name: 'SG Club Poly Match Leather Cricket Balls (Box of 6)',
    categoryId: 'cat-balls',
    category: 'Balls',
    sportId: 'sport-cricket',
    sport: 'Cricket',
    sku: 'PROD-SG-LEATHER-6',
    price: 2499.00,
    memberPrice: 1999.00,
    rating: 4.6,
    badge: 'Match Ball',
    description: 'Alum tanned high-grade leather with linen stitching, formulated for match endurance on turf wickets.',
    imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80',
    stock: 15,
    inStock: true,
    isLowStock: false,
    isActive: true
  }
];

let dynamicOrders = [];

function createError(message, status = 500, details = null) {
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
  if (details) err.details = details;
  return err;
}

/**
 * GET /api/products
 */
export async function getProducts({ category = '', search = '', sport = '', inStock, lowStock } = {}) {
  const queryParams = new URLSearchParams();
  if (category && category !== 'All') queryParams.append('category', category);
  if (search) queryParams.append('search', search);
  if (sport && sport !== 'All') queryParams.append('sport', sport);
  if (inStock !== undefined) queryParams.append('inStock', inStock);
  if (lowStock !== undefined) queryParams.append('lowStock', lowStock);

  try {
    const url = `${API_BASE_URL}/api/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : FALLBACK_PRODUCTS;
  } catch (err) {
    // Isolated fallback matching query params
    let filtered = [...FALLBACK_PRODUCTS];
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    if (inStock === true || inStock === 'true') {
      filtered = filtered.filter(p => p.inStock);
    }
    return filtered;
  }
}

/**
 * GET /api/products/:id
 */
export async function getProductById(productId) {
  if (!productId) throw createError('Product ID is required', 400);

  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const found = FALLBACK_PRODUCTS.find(p => p.id === productId);
    if (found) return found;
    throw createError(`Product '${productId}' not found`, 404);
  }
}

/**
 * POST /api/shop/orders
 * Request contract:
 * {
 *   memberId?: string,
 *   customerName?: string,
 *   customerEmail?: string,
 *   customerPhone?: string,
 *   orderType: 'online_delivery' | 'online_pickup' | 'counter',
 *   fulfilmentType?: 'delivery' | 'pickup' | 'in_store',
 *   deliveryAddress?: string,
 *   deliveryNotes?: string,
 *   pickupTime?: string,
 *   items: [{ productId: string, quantity: number }]
 * }
 */
export async function createShopOrder(payload = {}) {
  // Client-side pre-validation
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw createError('Cannot checkout an empty shopping cart', 422);
  }

  for (let i = 0; i < payload.items.length; i++) {
    const item = payload.items[i];
    if (!item?.productId) {
      throw createError(`Item at index ${i} is missing product ID`, 422);
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw createError(`Quantity for item '${item.productId}' must be greater than 0`, 422);
    }
  }

  const orderType = payload.orderType || 'online_pickup';
  const fulfilmentType = payload.fulfilmentType || (orderType === 'online_delivery' ? 'delivery' : 'pickup');

  if (fulfilmentType === 'delivery' && (!payload.deliveryAddress || payload.deliveryAddress.trim().length < 5)) {
    throw createError('Please provide a valid delivery address (min 5 characters)', 422);
  }

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/shop/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payload,
        orderType,
        fulfilmentType
      })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createError(body.message || `Order creation failed with status ${res.status}`, res.status, body.errors);
    }

    // Save to local session order history cache
    if (body.data) {
      dynamicOrders.unshift(body.data);
    }

    return {
      success: true,
      data: body.data,
      message: body.message || 'Shop order placed successfully'
    };
  } catch (err) {
    if (err.status) throw err;

    // Offline order processor fallback for simulation/testing
    const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let calculatedSubtotal = 0;
    let calculatedDiscount = 0;
    const processedItems = [];

    for (const item of payload.items) {
      const prod = FALLBACK_PRODUCTS.find(p => p.id === item.productId);
      if (!prod) throw createError(`Product '${item.productId}' not found`, 404);
      if (prod.stock < item.quantity) {
        throw createError(`Insufficient shelf stock for '${prod.name}'. Available: ${prod.stock}, Requested: ${item.quantity}`, 409);
      }

      const retailPrice = prod.price;
      const isMember = Boolean(payload.memberId);
      const discountPct = isMember ? 20 : 0; // Default Gold tier demo
      const unitPrice = isMember ? Math.round(retailPrice * (1 - discountPct / 100) * 100) / 100 : retailPrice;
      const lineSubtotal = retailPrice * item.quantity;
      const lineTotal = unitPrice * item.quantity;

      calculatedSubtotal += lineSubtotal;
      calculatedDiscount += (lineSubtotal - lineTotal);

      processedItems.push({
        id: `so-item-${Date.now()}-${item.productId}`,
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: lineTotal
      });
    }

    const calculatedTax = Math.round((calculatedSubtotal - calculatedDiscount) * 0.05 * 100) / 100;
    const calculatedTotal = (calculatedSubtotal - calculatedDiscount) + calculatedTax;

    const mockOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      memberId: payload.memberId || null,
      customerName: payload.customerName || 'Club Member',
      customerEmail: payload.customerEmail || 'member@example.com',
      customerPhone: payload.customerPhone || '+919876543200',
      orderType,
      fulfilmentType,
      deliveryAddress: payload.deliveryAddress || null,
      deliveryNotes: payload.deliveryNotes || null,
      pickupTime: payload.pickupTime || null,
      status: 'pending',
      subtotal: calculatedSubtotal,
      discountAmount: calculatedDiscount,
      taxAmount: calculatedTax,
      totalAmount: calculatedTotal,
      paymentStatus: 'unpaid',
      totalItems: payload.items.length,
      totalQuantity: payload.items.reduce((acc, i) => acc + i.quantity, 0),
      items: processedItems,
      createdAt: new Date().toISOString()
    };

    dynamicOrders.unshift(mockOrder);

    return {
      success: true,
      data: mockOrder,
      message: 'Shop order placed successfully'
    };
  }
}

/**
 * GET /api/shop/orders
 */
export async function getShopOrders(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.memberId) queryParams.append('memberId', params.memberId);
  if (params.status) queryParams.append('status', params.status);

  const token = getAuthToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const url = `${API_BASE_URL}/api/shop/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || [];
  } catch {
    return dynamicOrders;
  }
}

/**
 * GET /api/shop/orders/:id
 */
export async function getShopOrderById(orderId) {
  if (!orderId) throw createError('Order ID is required', 400);

  const token = getAuthToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/shop/orders/${orderId}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const found = dynamicOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (found) return found;
    throw createError(`Order '${orderId}' not found`, 404);
  }
}

// --- CART LOCAL STORAGE UTILITIES ---
export function getStoredCart() {
  try {
    const raw = getStorage().getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(cartItems) {
  try {
    getStorage().setItem(CART_STORAGE_KEY, JSON.stringify(cartItems || []));
  } catch {
    // ignore
  }
}

export function clearStoredCart() {
  getStorage().removeItem(CART_STORAGE_KEY);
}

// --- STAFF & JBAC OPERATIONAL INVENTORY / CATALOGUE MANAGEMENT ---

/**
 * Staff/Admin: Create new catalogue product
 */
export async function createProduct(productData) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to create product', res.status || 500);
  return body.data;
}

/**
 * Staff/Admin: Update product details & price
 */
export async function updateProduct(id, updates) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to update product', res.status || 500);
  return body.data;
}

/**
 * Staff/Admin: Delete or archive product (preserves historical references)
 */
export async function deleteProduct(id) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to delete product', res.status || 500);
  return body.data;
}

/**
 * Staff/Admin: Get full inventory records
 */
export async function getInventory(params = {}) {
  const token = getAuthToken();
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.lowStockOnly) queryParams.append('lowStockOnly', params.lowStockOnly);

  const res = await fetch(`${API_BASE_URL}/api/inventory${queryParams.toString() ? '?' + queryParams.toString() : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch inventory');
  const body = await res.json();
  return body.data || [];
}

/**
 * Staff/Admin: Get low-stock items
 */
export async function getLowStockItems() {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/inventory/low-stock`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch low stock items');
  const body = await res.json();
  return body.data || [];
}

/**
 * Staff/Admin: Get stock movements audit history
 */
export async function getStockMovements(params = {}) {
  const token = getAuthToken();
  const queryParams = new URLSearchParams();
  if (params.productId) queryParams.append('productId', params.productId);

  const res = await fetch(`${API_BASE_URL}/api/inventory/movements${queryParams.toString() ? '?' + queryParams.toString() : ''}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch stock movements');
  const body = await res.json();
  return body.data || [];
}

/**
 * Staff/Admin: Record manual stock adjustment / intake movement
 */
export async function recordStockMovement(data) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/stock-movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to record stock movement', res.status || 500);
  return body.data;
}

/**
 * Staff/Admin: Update shop order status
 */
export async function updateShopOrderStatus(orderId, status, notes = '') {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}/api/shop/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status, notes })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to update order status', res.status || 500);
  return body.data;
}
