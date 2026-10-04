/**
 * Champions Club - Authentication API Service
 * 
 * Simple, clear, and direct authentication client.
 * Endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - POST /api/auth/logout
 * - GET  /api/auth/me
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

const TOKEN_KEY = 'champions_club_auth_token';
const USER_KEY = 'champions_club_auth_user';

// Safe storage accessor for both browser and Node test runner
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

export function getToken() {
  return getStorage().getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) getStorage().setItem(TOKEN_KEY, token);
  else removeToken();
}

export function removeToken() {
  getStorage().removeItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = getStorage().getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) getStorage().setItem(USER_KEY, JSON.stringify(user));
  else removeStoredUser();
}

export function removeStoredUser() {
  getStorage().removeItem(USER_KEY);
}

// Seed demo users matching backend database
const SEED_USERS = [
  { id: '1', email: 'admin@championsclub.com', password: 'Password@123', role: 'admin', firstName: 'Club', lastName: 'Administrator' },
  { id: '2', email: 'kenil.patel@championsclub.com', password: 'Password@123', role: 'manager', firstName: 'Kenil', lastName: 'Patel' },
  { id: '3', email: 'priya.nair@championsclub.com', password: 'Password@123', role: 'staff', firstName: 'Priya', lastName: 'Nair' },
  { id: '4', email: 'devon.conway@example.com', password: 'Password@123', role: 'member', firstName: 'Devon', lastName: 'Conway', memberId: 'MEM-8801', memberNumber: 'CC-2026-8801' },
  { id: '5', email: 'sarah.jenkins@example.com', password: 'Password@123', role: 'member', firstName: 'Sarah', lastName: 'Jenkins', memberId: 'MEM-4920', memberNumber: 'CC-2026-4920' }
];

let dynamicUsers = [];

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function createError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Login user
 */
export async function login({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createError(body.message || 'Invalid email or password', res.status);
    }

    const { user, token } = body.data || {};
    if (token) setToken(token);
    if (user) setStoredUser(user);

    return { success: true, data: { user, token }, message: body.message || 'Login successful' };
  } catch (err) {
    if (err.status) throw err;

    // Offline mode simulation
    const user = [...SEED_USERS, ...dynamicUsers].find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || user.password !== password) {
      throw createError('Invalid email or password', 401);
    }

    const token = `token-${user.id}-${Date.now()}`;
    const safeUser = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, memberId: user.memberId, memberNumber: user.memberNumber };

    setToken(token);
    setStoredUser(safeUser);
    return { success: true, data: { user: safeUser, token }, message: 'Login successful' };
  }
}

/**
 * Register user
 */
export async function register({ email, password, firstName, lastName, phone = '', role = 'member', staffJobTypeId = null }) {
  if (!email || !isValidEmail(email)) throw createError('Valid email is required', 422);
  if (!password || password.length < 6) throw createError('Password must be at least 6 characters', 422);
  if (!firstName || !firstName.trim()) throw createError('First name is required', 422);
  if (!lastName || !lastName.trim()) throw createError('Last name is required', 422);

  const payload = {
    email: email.toLowerCase().trim(),
    password,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone ? phone.trim() : null,
    role: role || 'member',
    staffJobTypeId: role === 'staff' ? staffJobTypeId : null
  };

  try {
    let res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createError(body.message || (res.status === 409 ? 'Email address is already registered' : 'Registration failed'), res.status);
    }

    const { user, member, token } = body.data || {};
    if (token) setToken(token);
    if (user) setStoredUser(user);

    return { success: true, data: body.data, message: body.message || 'Account registered successfully' };
  } catch (err) {
    if (err.status) throw err;

    // Offline duplicate check
    const exists = [...SEED_USERS, ...dynamicUsers].some((u) => u.email.toLowerCase() === payload.email);
    if (exists) throw createError('Email address is already registered', 409);

    const id = `usr-${Date.now()}`;
    const memberId = payload.role === 'member' ? `MEM-${Date.now().toString().slice(-4)}` : null;
    const memberNumber = memberId ? `CC-2026-${memberId.replace('MEM-', '')}` : null;

    const newUser = { ...payload, id, memberId, memberNumber };
    dynamicUsers.push(newUser);

    const token = `token-${id}`;
    const safeUser = { id, email: payload.email, role: payload.role, firstName: payload.firstName, lastName: payload.lastName, memberId, memberNumber };

    setToken(token);
    setStoredUser(safeUser);

    return {
      success: true,
      data: {
        user: safeUser,
        member: memberId ? { id: memberId, member_number: memberNumber, status: 'active' } : null,
        token
      },
      message: 'Account registered successfully'
    };
  }
}

/**
 * Get current session profile
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) {
    removeStoredUser();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      removeToken();
      removeStoredUser();
      return null;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const user = body.data || body;
    setStoredUser(user);
    return user;
  } catch {
    return getStoredUser();
  }
}

/**
 * Quick POS/Terminal PIN login for staff
 */
export async function pinLogin({ pin, employeeId }) {
  if (!pin) throw createError('PIN code is required', 400);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, employeeId })
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw createError(body.message || 'Invalid employee identifier or PIN', res.status || 401);
    }

    const { staff, token } = body.data || {};
    const safeUser = {
      id: staff?.id || 'staff-session',
      email: staff?.email || 'staff@championsclub.com',
      role: 'staff',
      firstName: staff?.name ? staff.name.split(' ')[0] : 'Staff',
      lastName: staff?.name ? staff.name.split(' ').slice(1).join(' ') : 'Member',
      department: staff?.department || 'Operations'
    };

    if (token) setToken(token);
    setStoredUser(safeUser);

    return { success: true, data: { user: safeUser, staff, token }, message: body.message || 'Terminal authenticated' };
  } catch (err) {
    if (err.status) throw err;

    // Offline PIN fallback simulation
    if (pin === '1234' || pin === '9999') {
      const token = `pin-token-${Date.now()}`;
      const safeUser = {
        id: 'staff-terminal',
        email: 'priya.nair@championsclub.com',
        role: 'staff',
        firstName: 'Priya',
        lastName: 'Nair',
        department: 'bar'
      };
      setToken(token);
      setStoredUser(safeUser);
      return { success: true, data: { user: safeUser, token }, message: 'Terminal authenticated' };
    }
    throw createError('Invalid PIN for staff member', 401);
  }
}

/**
 * Logout
 */
export async function logout() {
  const token = getToken();
  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch {
    // Local cleanup takes precedence
  } finally {
    removeToken();
    removeStoredUser();
  }
  return { success: true, message: 'Logged out successfully' };
}

/**
 * Admin: List all registered club users
 */
export async function getAdminUsers() {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    const body = await res.json();
    return body.data || [];
  } catch {
    return [...SEED_USERS, ...dynamicUsers].map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone || '+919876543200',
      isActive: true,
      createdAt: new Date().toISOString(),
      memberNumber: u.memberNumber || null
    }));
  }
}

/**
 * Admin: Update user role
 */
export async function updateUserRole(userId, role) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw createError(body.message || 'Failed to update user role', res.status || 500);
    return body.data;
  } catch (err) {
    if (err.status) throw err;
    const user = [...SEED_USERS, ...dynamicUsers].find((u) => u.id === userId);
    if (user) {
      user.role = role;
      return user;
    }
    throw createError('User not found', 404);
  }
}

/**
 * Public/Authenticated: Get all active staff job types for staff registration & selectors
 */
export async function getStaffJobTypes() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/staff-job-types`);
    if (!res.ok) throw new Error('Failed to fetch staff job types');
    const body = await res.json();
    return body.data || [];
  } catch (err) {
    // Fallback default jobs
    return [
      { id: 'job-bar', code: 'bar', name: 'Bar Staff', description: 'Bar POS & orders' },
      { id: 'job-shop', code: 'shop_inventory', name: 'Shop & Inventory Staff', description: 'Pro Shop & Inventory management' },
      { id: 'job-reception', code: 'reception', name: 'Front Desk Staff', description: 'Member check-in & bookings' },
      { id: 'job-coaching', code: 'sports_coaching', name: 'Sports & Coaching Staff', description: 'Court coaching & sessions' },
      { id: 'job-maintenance', code: 'maintenance', name: 'Maintenance Staff', description: 'Facility maintenance' },
      { id: 'job-accounts', code: 'accounts', name: 'Accounts & Finance Staff', description: 'Club invoices & finances' }
    ];
  }
}

/**
 * Admin: List all staff job types with permission mappings
 */
export async function getAdminStaffJobs() {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/staff-job-types`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load staff jobs');
  const body = await res.json();
  return body.data || [];
}

/**
 * Admin: Create a new dynamic Staff Job Type
 */
export async function createAdminStaffJob(data) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/staff-job-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to create staff job', res.status || 500);
  return body.data;
}

/**
 * Admin: Update an existing Staff Job Type
 */
export async function updateAdminStaffJob(id, data) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/staff-job-types/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to update staff job', res.status || 500);
  return body.data;
}

/**
 * Admin: Get all available system permissions
 */
export async function getAdminPermissions() {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/permissions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load permissions');
  const body = await res.json();
  return body.data || { all: [], grouped: {} };
}

/**
 * Admin: Get all staff members with assigned jobs
 */
export async function getAdminStaffMembers() {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/staff`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load staff members');
  const body = await res.json();
  return body.data || [];
}

/**
 * Admin: Change a staff member's assigned Staff Job Type
 */
export async function updateAdminStaffMemberJob(employeeId, staffJobTypeId) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/staff/${employeeId}/job`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ staffJobTypeId })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to update staff job', res.status || 500);
  return body.data;
}

/**
 * Admin: Toggle staff active/inactive status
 */
export async function updateAdminStaffMemberStatus(employeeId, status) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/staff/${employeeId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw createError(body.message || 'Failed to update staff status', res.status || 500);
  return body.data;
}
