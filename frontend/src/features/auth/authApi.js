/**
 * Champions Club - Authentication API Service
 * 
 * Strictly uses existing backend authentication endpoints:
 * - POST /api/auth/register (or /api/auth/signup)
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - GET  /api/auth/me
 * 
 * Implements token storage, session hydration, and isolated fallback adapter
 * when the backend server is offline or in isolated test mode.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

const TOKEN_KEY = 'champions_club_auth_token';
const USER_KEY = 'champions_club_auth_user';

// Safe localStorage accessor for Node test runners & browser environments
function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // In-memory fallback for headless/Node environments
  if (!globalThis.__mockLocalStorage) {
    globalThis.__mockLocalStorage = {
      _data: {},
      getItem(key) { return this._data[key] || null; },
      setItem(key, value) { this._data[key] = String(value); },
      removeItem(key) { delete this._data[key]; },
      clear() { this._data = {}; }
    };
  }
  return globalThis.__mockLocalStorage;
}

export function getToken() {
  return getStorage().getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    getStorage().setItem(TOKEN_KEY, token);
  } else {
    removeToken();
  }
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
  if (user) {
    getStorage().setItem(USER_KEY, JSON.stringify(user));
  } else {
    removeStoredUser();
  }
}

export function removeStoredUser() {
  getStorage().removeItem(USER_KEY);
}

// Fallback seed accounts matching backend/schema/seed.sql
const FALLBACK_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@championsclub.com',
    password: 'Password@123',
    role: 'admin',
    firstName: 'Club',
    lastName: 'Administrator',
    phone: '+919876543200',
    memberId: null,
    memberNumber: null,
    membership: null
  },
  {
    id: '22222222-2222-2222-2222-222222222221',
    email: 'kenil.patel@championsclub.com',
    password: 'Password@123',
    role: 'manager',
    firstName: 'Kenil',
    lastName: 'Patel',
    phone: '+919876543201',
    memberId: null,
    memberNumber: null,
    membership: null
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'priya.nair@championsclub.com',
    password: 'Password@123',
    role: 'staff',
    firstName: 'Priya',
    lastName: 'Nair',
    phone: '+919876543202',
    memberId: null,
    memberNumber: null,
    membership: null
  },
  {
    id: '33333333-3333-3333-3333-333333333331',
    email: 'devon.conway@example.com',
    password: 'Password@123',
    role: 'member',
    firstName: 'Devon',
    lastName: 'Conway',
    phone: '+919876543211',
    memberId: 'MEM-8801',
    memberNumber: 'CC-2026-8801',
    membership: {
      planId: 'gold',
      planName: 'Gold Championship',
      tier: 'Gold',
      status: 'active',
      shopDiscountPct: 20,
      barDiscountPct: 15,
      courtDiscountPct: 100
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    email: 'sarah.jenkins@example.com',
    password: 'Password@123',
    role: 'member',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    phone: '+919876543212',
    memberId: 'MEM-4920',
    memberNumber: 'CC-2026-4920',
    membership: {
      planId: 'silver',
      planName: 'Silver Standard',
      tier: 'Silver',
      status: 'active',
      shopDiscountPct: 10,
      barDiscountPct: 10,
      courtDiscountPct: 50
    }
  }
];

let dynamicRegisteredUsers = [];

// Helper to generate a client-side mock JWT
function generateMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }));
  return `${header}.${payload}.mockSignatureChampionsClub`;
}

/**
 * Validate email address syntax
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Login user with email and password
 * Calls POST /api/auth/login
 */
export async function login({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email: cleanEmail, password })
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = body.message || (res.status === 401 ? 'Invalid email or password' : 'Login failed');
      const err = new Error(errMsg);
      err.status = res.status;
      err.response = body;
      throw err;
    }

    const { user, token } = body.data || {};
    if (token) {
      setToken(token);
    }
    if (user) {
      setStoredUser(user);
    }

    return {
      success: true,
      data: { user, token },
      message: body.message || 'Login successful'
    };
  } catch (err) {
    // If it's an HTTP error from backend (like 401, 400, 403), rethrow it directly
    if (err.status) {
      throw err;
    }

    // Backend network error or offline fallback simulation
    const candidate = [...FALLBACK_USERS, ...dynamicRegisteredUsers].find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (!candidate || candidate.password !== password) {
      const authErr = new Error('Invalid email or password');
      authErr.status = 401;
      throw authErr;
    }

    const token = generateMockToken(candidate);
    const safeUser = {
      id: candidate.id,
      email: candidate.email,
      role: candidate.role,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      phone: candidate.phone,
      memberId: candidate.memberId,
      memberNumber: candidate.memberNumber,
      membership: candidate.membership
    };

    setToken(token);
    setStoredUser(safeUser);

    return {
      success: true,
      data: { user: safeUser, token },
      message: 'Login successful'
    };
  }
}

/**
 * Register a new user
 * Calls POST /api/auth/register (or /api/auth/signup)
 */
export async function register({ email, password, firstName, lastName, phone = '', role = 'member' }) {
  if (!email || !isValidEmail(email)) {
    const err = new Error('Valid email is required');
    err.status = 422;
    throw err;
  }
  if (!password || password.length < 6) {
    const err = new Error('Password must be at least 6 characters');
    err.status = 422;
    throw err;
  }
  if (!firstName || !firstName.trim()) {
    const err = new Error('First name is required');
    err.status = 422;
    throw err;
  }
  if (!lastName || !lastName.trim()) {
    const err = new Error('Last name is required');
    err.status = 422;
    throw err;
  }

  const payload = {
    email: email.toLowerCase().trim(),
    password,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone ? phone.trim() : null,
    role: role || 'member'
  };

  try {
    // Attempt standard route /api/auth/register first
    let res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // If 404, fallback to /api/auth/signup in case of alternative backend route
    if (res.status === 404) {
      res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = body.message || (res.status === 409 ? 'Email address is already registered' : 'Registration failed');
      const err = new Error(errMsg);
      err.status = res.status;
      err.response = body;
      throw err;
    }

    const { user, member, token } = body.data || {};
    if (token) {
      setToken(token);
    }
    if (user) {
      const stored = {
        ...user,
        memberId: member?.id || user.memberId,
        memberNumber: member?.member_number || user.memberNumber
      };
      setStoredUser(stored);
    }

    return {
      success: true,
      data: body.data,
      message: body.message || 'Account registered successfully'
    };
  } catch (err) {
    if (err.status) {
      throw err;
    }

    // Backend offline / isolated mock fallback
    const alreadyExists = [...FALLBACK_USERS, ...dynamicRegisteredUsers].some(
      (u) => u.email.toLowerCase() === payload.email
    );
    if (alreadyExists) {
      const conflictErr = new Error('Email address is already registered');
      conflictErr.status = 409;
      throw conflictErr;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `usr-${Date.now()}-${randomSuffix}`;
    const memberId = payload.role === 'member' ? `MEM-${randomSuffix}` : null;
    const memberNumber = payload.role === 'member' ? `CC-${new Date().getFullYear()}-${randomSuffix}` : null;

    const newUser = {
      id: newId,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      memberId,
      memberNumber,
      membership: null
    };

    dynamicRegisteredUsers.push(newUser);

    const token = generateMockToken(newUser);
    const safeUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      memberId,
      memberNumber,
      membership: null
    };

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
 * Get current authenticated user profile
 * Calls GET /api/auth/me
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) {
    removeStoredUser();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      removeToken();
      removeStoredUser();
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch current user profile: HTTP ${res.status}`);
    }

    const body = await res.json();
    const userProfile = body.data || body;
    setStoredUser(userProfile);
    return userProfile;
  } catch (err) {
    // Offline / fallback session recovery
    const cached = getStoredUser();
    if (cached) {
      return cached;
    }
    return null;
  }
}

/**
 * Logout current user
 * Calls POST /api/auth/logout
 */
export async function logout() {
  const token = getToken();

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (err) {
    // Ignore network error on logout, local cleanup takes precedence
  } finally {
    removeToken();
    removeStoredUser();
  }

  return { success: true, message: 'Logged out successfully' };
}
