/**
 * Champions Club - CRM & Enquiry Management API Service
 * Role: MEMBER 2 (Enquiry Coordination, Lead Follow-ups, Quotations & Trial Bookings)
 * 
 * Frozen API Endpoints:
 * - GET  /api/leads
 * - GET  /api/leads/:id
 * - PATCH /api/leads/:id
 * - POST /api/leads/:id/followups
 * - GET  /api/leads/:id/followups
 * - POST /api/leads/:id/quotations
 * - POST /api/leads/:id/trials
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
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

// Canonical Lead Statuses
export const LEAD_STATUSES = [
  { value: 'new', label: 'New Enquiry', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'trial_booked', label: 'Trial Booked', color: 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/30' },
  { value: 'quoted', label: 'Quotation Sent', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { value: 'converted', label: 'Converted to Member', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'lost', label: 'Closed / Lost', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
];

export const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'in_person', label: 'In-Person Front Desk' }
];

// Fallback seed leads matching canonical database
export const SEED_LEADS = [
  {
    id: 'LEAD-101',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@example.com',
    phone: '+919822334455',
    sport: 'Tennis',
    interestTier: 'Gold',
    interest_tier: 'Gold',
    source: 'website',
    status: 'trial_booked',
    message: 'Interested in peak evening tennis slot access and weekend coaching.',
    assignedTo: null,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'LEAD-102',
    name: 'Kavita Iyer',
    email: 'kavita.iyer@example.com',
    phone: '+919811223344',
    sport: 'Cricket',
    interestTier: 'Silver',
    interest_tier: 'Silver',
    source: 'website',
    status: 'contacted',
    message: 'Looking for box cricket weekend arena booking for company sports team.',
    assignedTo: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'LEAD-103',
    name: 'Vikramaditya Roy',
    email: 'vikram.roy@example.com',
    phone: '+919833445566',
    sport: 'Padel',
    interestTier: 'Gold',
    interest_tier: 'Gold',
    source: 'walk_in',
    status: 'new',
    message: 'Enquired about introductory padel clinics and racket hire packages.',
    assignedTo: null,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: 'LEAD-104',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@example.com',
    phone: '+919877001122',
    sport: 'Tennis',
    interestTier: 'Junior',
    interest_tier: 'Junior',
    source: 'referral',
    status: 'quoted',
    message: 'Seeking elite junior academy training schedule for 14-year-old state player.',
    assignedTo: null,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const SEED_FOLLOWUPS = [
  {
    id: 'fup-101-1',
    leadId: 'LEAD-101',
    lead_id: 'LEAD-101',
    followupDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    followup_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    contactMethod: 'phone',
    contact_method: 'phone',
    summary: 'Discussed Gold membership privileges and complimentary court slot reservations.',
    outcome: 'Positive interest, requested Centre Court trial session.',
    nextActionDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    next_action_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'fup-102-1',
    leadId: 'LEAD-102',
    lead_id: 'LEAD-102',
    followupDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    followup_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    contactMethod: 'whatsapp',
    contact_method: 'whatsapp',
    summary: 'Sent box cricket tariff sheets and peak floodlight booking schedules.',
    outcome: 'Awaiting team committee confirmation.',
    nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    next_action_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const SEED_QUOTATIONS = [
  {
    id: 'qt-104-1',
    quotationNumber: 'QT-2026-0041',
    quotation_number: 'QT-2026-0041',
    leadId: 'LEAD-104',
    lead_id: 'LEAD-104',
    title: 'Junior Rising Star Annual Academy Membership Quote',
    planId: 'junior',
    plan_id: 'junior',
    amount: 14390.00,
    discountAmount: 1000.00,
    discount_amount: 1000.00,
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'sent',
    terms: 'Includes weekly weekend academy clinics, off-peak court reservations and 10% pro gear discount.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const SEED_TRIALS = [
  {
    id: 'trial-101-1',
    leadId: 'LEAD-101',
    lead_id: 'LEAD-101',
    courtId: 'court-1',
    court_id: 'court-1',
    courtName: 'Centre Court (Tennis)',
    scheduledTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    scheduled_time: new Date(Date.now() + 2 * 86400000).toISOString(),
    durationMinutes: 60,
    duration_minutes: 60,
    status: 'scheduled',
    feedback: 'Scheduled 60-min trial on Plexipave court with assistant pro.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

// Runtime in-memory storage for realistic fallback simulation
let inMemoryLeads = JSON.parse(JSON.stringify(SEED_LEADS));
let inMemoryFollowups = JSON.parse(JSON.stringify(SEED_FOLLOWUPS));
let inMemoryQuotations = JSON.parse(JSON.stringify(SEED_QUOTATIONS));
let inMemoryTrials = JSON.parse(JSON.stringify(SEED_TRIALS));

export function resetInMemoryCrmState() {
  inMemoryLeads = JSON.parse(JSON.stringify(SEED_LEADS));
  inMemoryFollowups = JSON.parse(JSON.stringify(SEED_FOLLOWUPS));
  inMemoryQuotations = JSON.parse(JSON.stringify(SEED_QUOTATIONS));
  inMemoryTrials = JSON.parse(JSON.stringify(SEED_TRIALS));
}

function createError(message, status = 500, details = null) {
  const err = new Error(message);
  err.status = status;
  err.statusCode = status;
  if (details) err.details = details;
  return err;
}

/**
 * GET /api/leads
 */
export async function getLeads(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
  if (filters.sport && filters.sport !== 'all') queryParams.append('sport', filters.sport);
  if (filters.search) queryParams.append('search', filters.search);

  const token = getAuthToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const url = `${API_BASE_URL}/api/leads${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    // In-memory filter fallback
    let result = [...inMemoryLeads];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(l => l.status === filters.status);
    }
    if (filters.sport && filters.sport !== 'all') {
      result = result.filter(l => l.sport?.toLowerCase() === filters.sport.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.sport && l.sport.toLowerCase().includes(q))
      );
    }
    return result;
  }
}

/**
 * GET /api/leads/:id
 */
export async function getLeadById(leadId) {
  if (!leadId) throw createError('Lead ID is required', 400);

  const token = getAuthToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const found = inMemoryLeads.find(l => l.id === leadId);
    if (!found) throw createError(`Enquiry Lead '${leadId}' not found`, 404);

    const followups = inMemoryFollowups.filter(f => f.leadId === leadId || f.lead_id === leadId);
    const quotations = inMemoryQuotations.filter(q => q.leadId === leadId || q.lead_id === leadId);
    const trials = inMemoryTrials.filter(t => t.leadId === leadId || t.lead_id === leadId);

    return {
      ...found,
      followups,
      quotations,
      trials
    };
  }
}

/**
 * PATCH /api/leads/:id
 */
export async function updateLead(leadId, updates = {}) {
  if (!leadId) throw createError('Lead ID is required', 400);

  // Validation: Check required fields when editing
  if (updates.name !== undefined && !updates.name.trim()) {
    throw createError('Lead full name cannot be empty', 422);
  }
  if (updates.email !== undefined && (!updates.email.trim() || !updates.email.includes('@'))) {
    throw createError('Valid email address is required', 422);
  }
  if (updates.phone !== undefined && !updates.phone.trim()) {
    throw createError('Phone number is required', 422);
  }
  if (updates.status && !LEAD_STATUSES.some(s => s.value === updates.status)) {
    throw createError(`Invalid status '${updates.status}'. Must be one of canonical values.`, 422);
  }

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const index = inMemoryLeads.findIndex(l => l.id === leadId);
    if (index === -1) throw createError(`Enquiry Lead '${leadId}' not found`, 404);

    inMemoryLeads[index] = {
      ...inMemoryLeads[index],
      ...updates,
      interest_tier: updates.interestTier || updates.interest_tier || inMemoryLeads[index].interest_tier,
      updatedAt: new Date().toISOString()
    };

    return inMemoryLeads[index];
  }
}

/**
 * GET /api/leads/:id/followups
 */
export async function getLeadFollowups(leadId) {
  if (!leadId) throw createError('Lead ID is required', 400);

  const token = getAuthToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/followups`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    return inMemoryFollowups.filter(f => f.leadId === leadId || f.lead_id === leadId);
  }
}

/**
 * POST /api/leads/:id/followups
 */
export async function createLeadFollowup(leadId, followupPayload = {}) {
  if (!leadId) throw createError('Lead ID is required', 400);

  // Validation: Required note/summary and valid contact method
  if (!followupPayload.summary || !followupPayload.summary.trim()) {
    throw createError('Follow-up summary note is required', 422);
  }
  const method = followupPayload.contactMethod || followupPayload.contact_method || 'phone';
  if (!CONTACT_METHODS.some(m => m.value === method)) {
    throw createError('Invalid contact method. Must be phone, email, whatsapp, or in_person.', 422);
  }

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/followups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...followupPayload,
        contact_method: method
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const lead = inMemoryLeads.find(l => l.id === leadId);
    if (!lead) throw createError(`Enquiry Lead '${leadId}' not found`, 404);

    const newFollowup = {
      id: `fup-${Date.now()}`,
      leadId,
      lead_id: leadId,
      followupDate: followupPayload.followupDate || new Date().toISOString(),
      followup_date: followupPayload.followupDate || new Date().toISOString(),
      contactMethod: method,
      contact_method: method,
      summary: followupPayload.summary.trim(),
      outcome: followupPayload.outcome ? followupPayload.outcome.trim() : 'Follow-up logged',
      nextActionDate: followupPayload.nextActionDate || null,
      next_action_date: followupPayload.nextActionDate || null,
      createdAt: new Date().toISOString()
    };

    inMemoryFollowups.unshift(newFollowup);

    // Automatically transition lead from 'new' to 'contacted' if applicable
    if (lead.status === 'new') {
      lead.status = 'contacted';
      lead.updatedAt = new Date().toISOString();
    }

    return newFollowup;
  }
}

/**
 * POST /api/leads/:id/quotations
 */
export async function createLeadQuotation(leadId, quotationPayload = {}) {
  if (!leadId) throw createError('Lead ID is required', 400);

  if (!quotationPayload.title || !quotationPayload.title.trim()) {
    throw createError('Quotation title is required', 422);
  }

  const rawAmount = Number(quotationPayload.amount);
  if (isNaN(rawAmount) || rawAmount <= 0) {
    throw createError('Quote amount must be a positive number', 422);
  }

  if (!quotationPayload.validUntil && !quotationPayload.valid_until) {
    throw createError('Quotation expiration date (validUntil) is required', 422);
  }

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/quotations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(quotationPayload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const lead = inMemoryLeads.find(l => l.id === leadId);
    if (!lead) throw createError(`Enquiry Lead '${leadId}' not found`, 404);

    const quotationNumber = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const discountAmount = Number(quotationPayload.discountAmount || quotationPayload.discount_amount || 0);

    const newQuotation = {
      id: `qt-${Date.now()}`,
      quotationNumber,
      quotation_number: quotationNumber,
      leadId,
      lead_id: leadId,
      title: quotationPayload.title.trim(),
      planId: quotationPayload.planId || quotationPayload.plan_id || null,
      plan_id: quotationPayload.planId || quotationPayload.plan_id || null,
      amount: rawAmount,
      discountAmount,
      discount_amount: discountAmount,
      validUntil: quotationPayload.validUntil || quotationPayload.valid_until,
      valid_until: quotationPayload.validUntil || quotationPayload.valid_until,
      status: 'sent',
      terms: quotationPayload.terms ? quotationPayload.terms.trim() : 'Includes standard club court reservation rights and welcome gear bundle.',
      createdAt: new Date().toISOString()
    };

    inMemoryQuotations.unshift(newQuotation);

    // Update lead status to 'quoted'
    lead.status = 'quoted';
    lead.updatedAt = new Date().toISOString();

    return newQuotation;
  }
}

/**
 * POST /api/leads/:id/trials
 */
export async function createLeadTrial(leadId, trialPayload = {}) {
  if (!leadId) throw createError('Lead ID is required', 400);

  if (!trialPayload.courtId && !trialPayload.court_id) {
    throw createError('Selected court is required for trial booking', 422);
  }
  if (!trialPayload.scheduledTime && !trialPayload.scheduled_time) {
    throw createError('Scheduled time is required for trial session', 422);
  }

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/leads/${leadId}/trials`, {
      method: 'POST',
      headers,
      body: JSON.stringify(trialPayload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data || body;
  } catch {
    const lead = inMemoryLeads.find(l => l.id === leadId);
    if (!lead) throw createError(`Enquiry Lead '${leadId}' not found`, 404);

    const courtId = trialPayload.courtId || trialPayload.court_id;
    const courtName = courtId === 'court-1' ? 'Centre Court (Tennis)' : courtId === 'court-3' ? 'Box Cricket Arena 1' : courtId === 'court-5' ? 'Padel Court Alpha' : 'Club Court';

    const newTrial = {
      id: `trial-${Date.now()}`,
      leadId,
      lead_id: leadId,
      courtId,
      court_id: courtId,
      courtName,
      scheduledTime: trialPayload.scheduledTime || trialPayload.scheduled_time,
      scheduled_time: trialPayload.scheduledTime || trialPayload.scheduled_time,
      durationMinutes: Number(trialPayload.durationMinutes || trialPayload.duration_minutes || 60),
      duration_minutes: Number(trialPayload.durationMinutes || trialPayload.duration_minutes || 60),
      status: 'scheduled',
      feedback: trialPayload.feedback ? trialPayload.feedback.trim() : 'Free introductory coaching evaluation scheduled.',
      createdAt: new Date().toISOString()
    };

    inMemoryTrials.unshift(newTrial);

    // Update lead status to 'trial_booked'
    lead.status = 'trial_booked';
    lead.updatedAt = new Date().toISOString();

    return newTrial;
  }
}
