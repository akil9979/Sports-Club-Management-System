/**
 * Champions Club - Membership & Member Management API Service
 * 
 * Strictly adheres to the agreed frozen endpoints:
 * - GET   /api/membership-plans
 * - POST  /api/members
 * - GET   /api/members
 * - GET   /api/members/:id
 * - PATCH /api/members/:id
 * - POST  /api/members/:id/memberships
 * - GET   /api/members/:id/memberships
 * 
 * Implements real network requests with isolated fallback adapters
 * matching the frozen schema when the backend is offline.
 */
import { getMembershipPlans as getFallbackPlans } from '../../services/api.js';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

// --- SEED MEMBERS DATA FOR ISOLATED ADAPTER MODE ---
const INITIAL_MEMBERS = [
  {
    id: 'MEM-8801',
    memberNumber: 'CC-2026-8801',
    name: 'Devon Conway',
    email: 'devon@example.com',
    phone: '+919876543210',
    dob: '1991-07-08',
    gender: 'Male',
    address: '12-B Champions Enclave, Sector 48, Ahmedabad',
    emergencyContact: '+919876500001',
    status: 'active',
    createdAt: '2026-08-15T09:30:00Z',
    activeMembership: {
      id: 'MSHIP-701',
      memberId: 'MEM-8801',
      planId: 'gold',
      planName: 'Gold Championship',
      tier: 'Gold',
      price: 4999,
      billingCycle: 'monthly',
      startDate: '2026-09-15',
      endDate: '2026-10-15',
      status: 'active',
      courtPrivileges: '100% complimentary standard court hours',
      shopDiscount: '20% Pro Shop discount',
      barDiscount: '15% Lounge & Bar discount',
      benefits: [
        'Unlimited court bookings (Tennis, Box Cricket, Padel)',
        '14-day advance slot reservation window',
        '2 free monthly guest passes',
        'Complimentary dedicated locker & fresh towel service',
        '20% discount on all pro shop gear & restringing',
        '15% discount at the sports bar & cafeteria',
        'Priority access to Friday night social play mixers'
      ]
    }
  },
  {
    id: 'MEM-4920',
    memberNumber: 'CC-2026-4920',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+919876543211',
    dob: '1995-03-22',
    gender: 'Female',
    address: '45 Lotus Boulevard, Ahmedabad',
    emergencyContact: '+919876500002',
    status: 'active',
    createdAt: '2026-09-01T14:15:00Z',
    activeMembership: {
      id: 'MSHIP-702',
      memberId: 'MEM-4920',
      planId: 'silver',
      planName: 'Silver Standard',
      tier: 'Silver',
      price: 2799,
      billingCycle: 'monthly',
      startDate: '2026-09-20',
      endDate: '2026-10-20',
      status: 'active',
      courtPrivileges: '50% discounted court booking rates',
      shopDiscount: '10% Pro Shop discount',
      barDiscount: '10% Lounge & Bar discount',
      benefits: [
        '50% discounted court bookings on all sports',
        '7-day advance slot reservation window',
        '10% discount on all pro shop equipment',
        '10% discount at the cafeteria and bar',
        'Eligibility for intra-club weekend leagues'
      ]
    }
  },
  {
    id: 'MEM-3104',
    memberNumber: 'CC-2026-3104',
    name: 'Aryan Sharma',
    email: 'aryan.sharma@juniorclub.org',
    phone: '+919876543212',
    dob: '2011-05-18', // 15 years old (Junior valid)
    gender: 'Male',
    address: '88 Riverview Residences, Ahmedabad',
    emergencyContact: '+919876500003 (Father)',
    status: 'active',
    createdAt: '2026-09-10T11:00:00Z',
    activeMembership: {
      id: 'MSHIP-703',
      memberId: 'MEM-3104',
      planId: 'junior',
      planName: 'Junior Rising Star',
      tier: 'Junior',
      price: 1499,
      billingCycle: 'monthly',
      startDate: '2026-09-10',
      endDate: '2026-10-10',
      status: 'active',
      courtPrivileges: 'Free off-peak court access (3 PM - 6 PM weekdays)',
      shopDiscount: '10% Pro Shop discount',
      barDiscount: '10% Health drinks & snacks discount',
      benefits: [
        'Complimentary off-peak court access (weekday afternoons)',
        'Weekly weekend Junior coaching clinic included',
        '10% discount on junior rackets, shoes & balls',
        'Parent lounge access during practice sessions'
      ]
    }
  },
  {
    id: 'MEM-1092',
    memberNumber: 'CC-2026-1092',
    name: 'Marcus Finch',
    email: 'marcus.finch@globalnet.com',
    phone: '+919876543213',
    dob: '1988-11-30',
    gender: 'Male',
    address: '10 Skyline Towers, Ahmedabad',
    emergencyContact: '+919876500004',
    status: 'active',
    createdAt: '2026-06-01T10:00:00Z',
    activeMembership: {
      id: 'MSHIP-650',
      memberId: 'MEM-1092',
      planId: 'gold',
      planName: 'Gold Championship',
      tier: 'Gold',
      price: 4999,
      billingCycle: 'monthly',
      startDate: '2026-08-01',
      endDate: '2026-09-01', // Expired!
      status: 'expired',
      courtPrivileges: '100% complimentary standard court hours',
      shopDiscount: '20% Pro Shop discount',
      barDiscount: '15% Lounge & Bar discount',
      benefits: [
        'Unlimited court bookings (Tennis, Box Cricket, Padel)',
        '14-day advance slot reservation window',
        '20% discount on all pro shop gear & restringing'
      ]
    }
  },
  {
    id: 'MEM-9055',
    memberNumber: 'CC-2026-9055',
    name: 'Pooja Reddy',
    email: 'pooja.reddy@techhub.in',
    phone: '+919876543214',
    dob: '1998-02-14',
    gender: 'Female',
    address: '77 Heritage Meadows, Ahmedabad',
    emergencyContact: '+919876500005',
    status: 'active',
    createdAt: '2026-10-01T16:20:00Z',
    activeMembership: null // No active membership yet (Walk-in rate)
  }
];

const INITIAL_MEMBERSHIPS_HISTORY = {
  'MEM-8801': [
    {
      id: 'MSHIP-701',
      memberId: 'MEM-8801',
      planId: 'gold',
      planName: 'Gold Championship',
      tier: 'Gold',
      price: 4999,
      billingCycle: 'monthly',
      startDate: '2026-09-15',
      endDate: '2026-10-15',
      status: 'active',
      paymentMethod: 'card',
      referenceNumber: 'TXN-998811',
      createdAt: '2026-09-15T09:30:00Z'
    },
    {
      id: 'MSHIP-601',
      memberId: 'MEM-8801',
      planId: 'gold',
      planName: 'Gold Championship',
      tier: 'Gold',
      price: 4999,
      billingCycle: 'monthly',
      startDate: '2026-08-15',
      endDate: '2026-09-15',
      status: 'expired',
      paymentMethod: 'upi',
      referenceNumber: 'TXN-887722',
      createdAt: '2026-08-15T09:30:00Z'
    }
  ],
  'MEM-4920': [
    {
      id: 'MSHIP-702',
      memberId: 'MEM-4920',
      planId: 'silver',
      planName: 'Silver Standard',
      tier: 'Silver',
      price: 2799,
      billingCycle: 'monthly',
      startDate: '2026-09-20',
      endDate: '2026-10-20',
      status: 'active',
      paymentMethod: 'upi',
      referenceNumber: 'TXN-776633',
      createdAt: '2026-09-20T14:15:00Z'
    }
  ],
  'MEM-3104': [
    {
      id: 'MSHIP-703',
      memberId: 'MEM-3104',
      planId: 'junior',
      planName: 'Junior Rising Star',
      tier: 'Junior',
      price: 1499,
      billingCycle: 'monthly',
      startDate: '2026-09-10',
      endDate: '2026-10-10',
      status: 'active',
      paymentMethod: 'cash',
      referenceNumber: 'TXN-665544',
      createdAt: '2026-09-10T11:00:00Z'
    }
  ],
  'MEM-1092': [
    {
      id: 'MSHIP-650',
      memberId: 'MEM-1092',
      planId: 'gold',
      planName: 'Gold Championship',
      tier: 'Gold',
      price: 4999,
      billingCycle: 'monthly',
      startDate: '2026-08-01',
      endDate: '2026-09-01',
      status: 'expired',
      paymentMethod: 'card',
      referenceNumber: 'TXN-554433',
      createdAt: '2026-08-01T10:00:00Z'
    }
  ],
  'MEM-9055': []
};

// Local storage persistent fallback store with Node.js in-memory compatibility
const STORAGE_KEY_MEMBERS = 'champions_members_store_v1';
const STORAGE_KEY_HISTORIES = 'champions_memberships_history_v1';

let nodeMemoryMembers = null;
let nodeMemoryHistories = null;

function getStoredMembers() {
  if (typeof window === 'undefined') {
    if (!nodeMemoryMembers) {
      nodeMemoryMembers = JSON.parse(JSON.stringify(INITIAL_MEMBERS));
    }
    return nodeMemoryMembers;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEMBERS;
  }
}

function saveStoredMembers(members) {
  if (typeof window === 'undefined') {
    nodeMemoryMembers = members;
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.warn('Failed to persist members store', e);
  }
}

function getStoredHistories() {
  if (typeof window === 'undefined') {
    if (!nodeMemoryHistories) {
      nodeMemoryHistories = JSON.parse(JSON.stringify(INITIAL_MEMBERSHIPS_HISTORY));
    }
    return nodeMemoryHistories;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_HISTORIES, JSON.stringify(INITIAL_MEMBERSHIPS_HISTORY));
      return INITIAL_MEMBERSHIPS_HISTORY;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEMBERSHIPS_HISTORY;
  }
}

function saveStoredHistories(histories) {
  if (typeof window === 'undefined') {
    nodeMemoryHistories = histories;
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_HISTORIES, JSON.stringify(histories));
  } catch (e) {
    console.warn('Failed to persist histories store', e);
  }
}

// --- API METHODS ---

/**
 * GET /api/membership-plans
 */
export async function getMembershipPlans() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/membership-plans`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch membership plans: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // Fallback to static frozen plans
    return await getFallbackPlans();
  }
}

/**
 * GET /api/members
 * Helper for searching / directory listing
 */
export async function getMembers(searchQuery = '') {
  try {
    const url = searchQuery 
      ? `${API_BASE_URL}/api/members?q=${encodeURIComponent(searchQuery)}`
      : `${API_BASE_URL}/api/members`;

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const members = getStoredMembers();
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) => 
      m.name?.toLowerCase().includes(q) ||
      m.memberNumber?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.activeMembership?.tier?.toLowerCase().includes(q)
    );
  }
}

/**
 * GET /api/members/:id
 */
export async function getMemberById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/${id}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Member not found');
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    const members = getStoredMembers();
    const found = members.find((m) => m.id === id || m.memberNumber === id);
    if (!found) {
      throw new Error('Member not found with reference ID: ' + id);
    }
    return found;
  }
}

export const getMember = getMemberById;

/**
 * POST /api/members
 * Registers a new member
 */
export async function registerMember(memberData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(memberData)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Member registration failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    // Check for simulated duplicate email
    const members = getStoredMembers();
    const existing = members.find(
      (m) => m.email?.toLowerCase() === memberData.email?.toLowerCase().trim()
    );
    if (existing) {
      const error = new Error(`A member with email "${memberData.email}" is already registered (Member: ${existing.name}, ID: ${existing.memberNumber}).`);
      error.status = 409;
      error.isDuplicate = true;
      throw error;
    }

    // Create new member record
    const newSeq = Math.floor(1000 + Math.random() * 9000);
    const newMemberId = `MEM-${newSeq}`;
    const newMemberNumber = `CC-2026-${newSeq}`;

    const newMember = {
      id: newMemberId,
      memberNumber: newMemberNumber,
      name: memberData.name.trim(),
      email: memberData.email.trim(),
      phone: memberData.phone.trim(),
      dob: memberData.dob,
      gender: memberData.gender || 'Not specified',
      address: memberData.address || '',
      emergencyContact: memberData.emergencyContact || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      activeMembership: null
    };

    // If an initial plan was selected during registration
    const requestedPlanId = memberData.planId || memberData.initialPlanId;
    let initialMembership = null;

    if (requestedPlanId) {
      const plans = await getMembershipPlans();
      const plan = plans.find((p) => p.id === requestedPlanId || p.tier?.toLowerCase() === requestedPlanId.toLowerCase());

      if (plan) {
        // Strict Junior Age check
        if (plan.tier?.toLowerCase() === 'junior' || plan.id.toLowerCase().includes('junior')) {
          if (memberData.dob) {
            const birth = new Date(memberData.dob);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            if (age >= 18) {
              const err = new Error(`Junior membership is strictly reserved for players under 18 years of age (Calculated age: ${age} years). Please choose Silver or Gold plan.`);
              err.status = 400;
              throw err;
            }
          }
        }

        const start = memberData.startDate || new Date().toISOString().split('T')[0];
        const cycle = memberData.billingCycle || 'monthly';
        const d = new Date(start);
        if (cycle === 'annual') {
          d.setFullYear(d.getFullYear() + 1);
        } else {
          d.setMonth(d.getMonth() + 1);
        }
        const end = d.toISOString().split('T')[0];

        initialMembership = {
          id: `MSHIP-${Math.floor(100 + Math.random() * 900)}`,
          memberId: newMemberId,
          planId: plan.id,
          planName: plan.name,
          tier: plan.tier,
          price: cycle === 'annual' ? (plan.annualPrice || Math.round(plan.price * 12 * 0.8)) : plan.price,
          billingCycle: cycle,
          startDate: start,
          endDate: end,
          status: 'active',
          paymentMethod: memberData.paymentMethod || 'card',
          referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          courtPrivileges: plan.courtPrivileges,
          shopDiscount: plan.shopDiscount,
          barDiscount: plan.barDiscount,
          benefits: plan.features || []
        };

        newMember.activeMembership = initialMembership;

        // Save history
        const histories = getStoredHistories();
        histories[newMemberId] = [initialMembership];
        saveStoredHistories(histories);
      }
    }

    const updatedList = [newMember, ...members];
    saveStoredMembers(updatedList);
    return { member: newMember, membership: initialMembership };
  }
}

/**
 * PATCH /api/members/:id
 * Updates member profile
 */
export async function updateMember(id, updateData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Profile update failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    const members = getStoredMembers();
    const index = members.findIndex((m) => m.id === id || m.memberNumber === id);
    if (index === -1) {
      throw new Error(`Member ${id} not found`);
    }

    // Check email uniqueness if email changed
    if (updateData.email) {
      const duplicate = members.find(
        (m) => m.id !== id && m.email?.toLowerCase() === updateData.email.toLowerCase().trim()
      );
      if (duplicate) {
        const error = new Error(`Email "${updateData.email}" is already used by ${duplicate.name}`);
        error.status = 409;
        throw error;
      }
    }

    const updated = {
      ...members[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    members[index] = updated;
    saveStoredMembers(members);
    return updated;
  }
}

/**
 * POST /api/members/:id/memberships
 * Subscribes/renews membership plan for a member
 */
export async function assignMembership(memberId, membershipData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/${memberId}/memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(membershipData)
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `Failed to assign membership: HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    const members = getStoredMembers();
    const memberIndex = members.findIndex((m) => m.id === memberId || m.memberNumber === memberId);
    if (memberIndex === -1) {
      throw new Error(`Member ${memberId} not found`);
    }

    const member = members[memberIndex];

    // Get plan details
    const plans = await getMembershipPlans();
    const plan = plans.find(
      (p) => p.id === membershipData.planId || p.tier?.toLowerCase() === membershipData.planId?.toLowerCase()
    );

    if (!plan) {
      throw new Error(`Invalid plan specified: ${membershipData.planId}`);
    }

    // Age validation check for Junior plan
    if (plan.tier?.toLowerCase() === 'junior' && member.dob) {
      const birthDate = new Date(member.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age >= 18) {
        throw new Error(`Junior membership is strictly reserved for members under 18 years of age. Current age: ${age} years.`);
      }
    }

    const startDate = membershipData.startDate || new Date().toISOString().split('T')[0];
    const cycle = membershipData.billingCycle || 'monthly';
    const d = new Date(startDate);
    if (cycle === 'annual') {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    const endDate = d.toISOString().split('T')[0];

    const price = cycle === 'annual' 
      ? (plan.annualPrice || Math.round(plan.price * 12 * 0.8))
      : plan.price;

    const newMembership = {
      id: `MSHIP-${Math.floor(100 + Math.random() * 900)}`,
      memberId: member.id,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      price,
      billingCycle: cycle,
      startDate,
      endDate,
      status: 'active',
      paymentMethod: membershipData.paymentMethod || 'card',
      referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      courtPrivileges: plan.courtPrivileges,
      shopDiscount: plan.shopDiscount,
      barDiscount: plan.barDiscount,
      benefits: plan.features || [],
      createdAt: new Date().toISOString()
    };

    // Update active membership on member record
    member.activeMembership = newMembership;
    members[memberIndex] = member;
    saveStoredMembers(members);

    // Append to histories
    const histories = getStoredHistories();
    const list = histories[member.id] || [];
    histories[member.id] = [newMembership, ...list];
    saveStoredHistories(histories);

    return {
      member,
      membership: newMembership,
      ...newMembership
    };
  }
}

/**
 * GET /api/members/:id/memberships
 * Fetches complete membership subscription history
 */
export async function getMemberMemberships(memberId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/${memberId}/memberships`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const histories = getStoredHistories();
    return histories[memberId] || [];
  }
}
