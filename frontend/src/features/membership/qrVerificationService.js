/**
 * Champions Club - Frontdesk QR Verification & Pass Engine
 * 
 * Handles:
 * - QR code payload generation with security signatures and member credentials
 * - QR code rendering with tier-specific luxury styling (Gold, Silver, Junior)
 * - Image file QR decoding via jsQR
 * - Real-time camera video stream frame scanning
 * - Frontdesk verification logic (active, expiring soon, expired, junior age check)
 * - Frontdesk check-in logs & audit storage (online backend API + offline resilience)
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { getMembers } from './membershipApi.js';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
const LOCAL_STORAGE_CHECKINS_KEY = 'champions_club_frontdesk_checkins';

// Tier aesthetic colors
export const TIER_CONFIG = {
  Gold: {
    name: 'Gold Championship',
    badge: 'VIP Member',
    colorHex: '#dfc99a',
    accentDark: '#8c6b24',
    bgGradient: 'from-[#dfc99a]/20 via-[#07261c] to-[#02140e]',
    borderClass: 'border-[#dfc99a]/40',
    textGradient: 'from-[#fcfaf5] via-[#dfc99a] to-[#c59e4b]',
    glowColor: 'rgba(223, 201, 154, 0.25)',
    iconBg: 'bg-[#dfc99a]/20 text-[#dfc99a] border-[#dfc99a]/40'
  },
  Silver: {
    name: 'Silver Standard',
    badge: 'Club Member',
    colorHex: '#94a3b8',
    accentDark: '#334155',
    bgGradient: 'from-slate-800/40 via-[#07261c] to-[#02140e]',
    borderClass: 'border-slate-500/40',
    textGradient: 'from-slate-100 via-slate-300 to-slate-400',
    glowColor: 'rgba(148, 163, 184, 0.2)',
    iconBg: 'bg-slate-800 text-slate-200 border-slate-600'
  },
  Junior: {
    name: 'Junior Rising Star',
    badge: 'Youth Academy',
    colorHex: '#10b981',
    accentDark: '#047857',
    bgGradient: 'from-emerald-900/40 via-[#07261c] to-[#02140e]',
    borderClass: 'border-emerald-500/40',
    textGradient: 'from-emerald-100 via-emerald-300 to-teal-400',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  },
  Standard: {
    name: 'Standard Walk-In',
    badge: 'Visitor',
    colorHex: '#34d399',
    accentDark: '#065f46',
    bgGradient: 'from-[#07261c] to-[#02140e]',
    borderClass: 'border-emerald-900/50',
    textGradient: 'from-white to-emerald-200',
    glowColor: 'rgba(52, 211, 153, 0.1)',
    iconBg: 'bg-[#07261c] text-emerald-400 border-emerald-800'
  }
};

/**
 * Generate standardized JSON payload for a member's QR pass
 */
export function generateMemberQrPayload(member, membership = null) {
  if (!member) return null;
  const ms = membership || member.activeMembership || member.membership;

  // Age calculation
  let age = null;
  const dobRaw = member.dob || member.dateOfBirth || member.date_of_birth;
  if (dobRaw) {
    const dob = new Date(dobRaw);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }
  }

  // Days remaining calculation
  let daysRemaining = 0;
  let status = 'no_membership';
  const endDate = ms?.endDate || ms?.end_date;
  const startDate = ms?.startDate || ms?.start_date;

  if (endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0 || ms.status === 'expired') {
      status = 'expired';
    } else if (daysRemaining <= 7) {
      status = 'expiring_soon';
    } else {
      status = 'active';
    }
  }

  const tier = ms?.tier || ms?.plan_tier || ms?.planTier || 'Walk-In';
  const planName = ms?.planName || ms?.plan_name || 'Standard Walk-In';

  // Security checksum
  const idStr = member.id || '';
  const numStr = member.memberNumber || member.member_number || idStr;
  const checkSeed = `${idStr}|${numStr}|${tier}|${endDate || ''}|CHAMPIONS2026`;
  let hash = 0;
  for (let i = 0; i < checkSeed.length; i++) {
    hash = (hash << 5) - hash + checkSeed.charCodeAt(i);
    hash |= 0;
  }
  const checksum = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();

  return {
    type: 'CHAMPIONS_CLUB_MEMBERSHIP_PASS',
    version: '1.0',
    club: 'Champions Club',
    member: {
      id: member.id,
      memberNumber: numStr,
      name: member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim(),
      email: member.email,
      phone: member.phone,
      dob: dobRaw,
      age,
      gender: member.gender,
      emergencyContact: member.emergencyContact || member.emergency_contact_phone || member.emergency_contact_name,
      memberSince: member.createdAt || member.created_at
    },
    membership: {
      id: ms?.id || null,
      planId: ms?.planId || ms?.plan_id,
      planName,
      tier,
      status,
      startDate: startDate || '—',
      endDate: endDate || '—',
      daysRemaining,
      courtPrivileges: ms?.courtPrivileges || ms?.court_privileges || 'Standard hourly walk-in rates',
      shopDiscount: ms?.shopDiscount || `${ms?.shop_discount_pct || ms?.shopDiscountPct || 0}% Pro Shop discount`,
      barDiscount: ms?.barDiscount || `${ms?.bar_discount_pct || ms?.barDiscountPct || 0}% Lounge & Bar discount`,
      advanceBookingDays: ms?.advanceBookingDays || ms?.advance_booking_days || 7,
      guestPassesPerMonth: ms?.guestPassesPerMonth || ms?.guest_passes_per_month || 0,
      benefits: ms?.benefits || []
    },
    security: {
      signature: `CC-VERIFY-${checksum}`,
      issuedAt: new Date().toISOString()
    }
  };
}

/**
 * Render QR code as high-resolution Data URL (with tier-matching colors)
 */
export async function renderMemberQrDataUrl(payload, options = {}) {
  if (!payload) return null;
  const tier = payload.membership?.tier || 'Gold';
  const tierMeta = TIER_CONFIG[tier] || TIER_CONFIG.Gold;

  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: options.width || 360,
    color: {
      dark: tier === 'Gold' ? '#041c14' : tier === 'Silver' ? '#0f172a' : '#022c22',
      light: '#ffffff'
    },
    ...options
  });
}

/**
 * Decode QR Code from an HTML Image or Canvas using jsQR
 */
export function decodeQrFromImageElement(imgElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imgElement.naturalWidth || imgElement.width;
  canvas.height = imgElement.naturalHeight || imgElement.height;
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert'
  });
  return code ? code.data : null;
}

/**
 * Decode QR Code from an uploaded File (PNG, JPG, WebP)
 */
export async function decodeQrFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const raw = decodeQrFromImageElement(img);
          resolve(raw);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Scan a single frame from video element
 */
export function scanVideoFrame(videoElement, canvasElement) {
  if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null;
  }
  const canvas = canvasElement || document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert'
  });
  return code ? code.data : null;
}

/**
 * Verify scanned QR code (calls backend if available, falls back to stored roster)
 */
export async function verifyMemberQrCode(rawInput) {
  if (!rawInput) {
    throw new Error('Please provide a QR code or Member ID to verify');
  }

  // 1. Try real backend endpoint first
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/verify-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ qrPayload: rawInput })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    // Backend offline / unreachable, fallback to local roster matching identical schema
    console.info('Backend verify-qr offline, running local verification adapter:', err.message);
  }

  // 2. Local Fallback Verification Adapter
  let parsed = null;
  let targetId = typeof rawInput === 'string' ? rawInput.trim() : '';

  if (typeof rawInput === 'string' && (rawInput.startsWith('{') || rawInput.includes('CHAMPIONS_CLUB_MEMBERSHIP_PASS'))) {
    try {
      parsed = JSON.parse(rawInput);
      targetId = parsed?.member?.id || parsed?.member?.memberNumber || parsed?.memberId || targetId;
    } catch {
      // ignore
    }
  } else if (typeof rawInput === 'object') {
    parsed = rawInput;
    targetId = parsed?.member?.id || parsed?.member?.memberNumber || targetId;
  }

  // Load roster
  const roster = await getMembers();
  const searchClean = targetId.toLowerCase().trim();

  const found = roster.find(m => {
    return (
      (m.id && m.id.toLowerCase() === searchClean) ||
      (m.memberNumber && m.memberNumber.toLowerCase() === searchClean) ||
      (m.email && m.email.toLowerCase() === searchClean) ||
      (m.phone && m.phone.replace(/\D/g, '').includes(searchClean.replace(/\D/g, ''))) ||
      (m.name && m.name.toLowerCase().includes(searchClean))
    );
  }) || (parsed?.member ? {
    id: parsed.member.id,
    memberNumber: parsed.member.memberNumber,
    name: parsed.member.name,
    email: parsed.member.email,
    phone: parsed.member.phone,
    dob: parsed.member.dob,
    activeMembership: parsed.membership
  } : null);

  if (!found) {
    throw new Error(`Member not found for scanned identifier '${targetId}'`);
  }

  const ms = found.activeMembership || parsed?.membership || null;
  const dobRaw = found.dob || found.dateOfBirth || found.date_of_birth;

  // Calculate age
  let age = null;
  if (dobRaw) {
    const dob = new Date(dobRaw);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }
  }

  // Status & Days remaining
  let status = 'no_membership';
  let daysRemaining = 0;
  const alerts = [];
  const endDate = ms?.endDate || ms?.end_date;
  const startDate = ms?.startDate || ms?.start_date;
  const tier = ms?.tier || 'Walk-In';
  const planName = ms?.planName || 'Standard Walk-In';

  if (ms && endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0 || ms.status === 'expired') {
      status = 'expired';
      alerts.push({
        type: 'danger',
        code: 'MEMBERSHIP_EXPIRED',
        message: `Membership expired ${Math.abs(daysRemaining)} days ago on ${endDate}. Access restricted; prompt for plan renewal.`
      });
    } else if (daysRemaining <= 7) {
      status = 'expiring_soon';
      alerts.push({
        type: 'warning',
        code: 'EXPIRING_SOON',
        message: `Membership expiring in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} (${endDate}). Encourage early renewal.`
      });
    } else {
      status = 'active';
      alerts.push({
        type: 'success',
        code: 'ACTIVE_VALID',
        message: `Active ${tier} member in good standing with ${daysRemaining} days remaining.`
      });
    }

    // Junior age verification
    if (tier?.toLowerCase() === 'junior') {
      if (age !== null && age >= 18) {
        alerts.push({
          type: 'warning',
          code: 'JUNIOR_OVERAGE',
          message: `Member is ${age} years old and has graduated past Junior eligibility (< 18). Please upgrade to Silver or Gold tier.`
        });
      } else if (age !== null) {
        alerts.push({
          type: 'info',
          code: 'JUNIOR_VERIFIED',
          message: `Junior player verified: age ${age}. Parent/Guardian contact: ${found.emergencyContact || 'Recorded on file'}`
        });
      }
    }
  } else {
    status = 'no_membership';
    alerts.push({
      type: 'warning',
      code: 'NO_ACTIVE_MEMBERSHIP',
      message: 'Member currently has no active membership plan. Standard walk-in court & bar rates apply.'
    });
  }

  const accessGranted = status === 'active' || status === 'expiring_soon';

  return {
    valid: true,
    accessGranted,
    status,
    message: accessGranted
      ? `Verification Approved: ${found.name} (${tier} Member)`
      : `Verification Flagged: ${status === 'expired' ? 'Membership Expired' : 'No Active Membership'}`,
    member: {
      id: found.id,
      memberNumber: found.memberNumber || found.member_number || found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      dob: dobRaw,
      age,
      gender: found.gender,
      emergencyContact: found.emergencyContact || found.emergency_contact_phone || found.emergency_contact_name,
      status: found.status || 'active'
    },
    membership: ms ? {
      id: ms.id,
      planId: ms.planId || ms.plan_id,
      planName,
      tier,
      status,
      startDate,
      endDate,
      daysRemaining,
      billingCycle: ms.billingCycle || 'monthly'
    } : null,
    entitlements: {
      tier,
      courtPrivileges: ms?.courtPrivileges || 'Walk-in standard hourly court fee',
      shopDiscount: ms?.shopDiscount || '0% Pro Shop discount',
      barDiscount: ms?.barDiscount || '0% Lounge & Bar discount',
      advanceBookingDays: ms?.advanceBookingDays || 7,
      guestPassesPerMonth: ms?.guestPassesPerMonth || 0
    },
    alerts,
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Record a frontdesk check-in
 */
export async function logFrontdeskCheckIn(checkInData) {
  // 1. Try real backend endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/frontdesk/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(checkInData)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        saveLocalCheckIn(json.data.checkIn);
        return json.data;
      }
    }
  } catch (err) {
    console.info('Backend checkin offline, using local store:', err.message);
  }

  // 2. Local Fallback Record
  const newRecord = {
    id: `CHK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    memberId: checkInData.memberId,
    memberNumber: checkInData.memberNumber || checkInData.memberId,
    memberName: checkInData.memberName || 'Club Member',
    tier: checkInData.tier || 'Walk-In',
    status: checkInData.status || 'active',
    facility: checkInData.facility || 'General Clubhouse',
    staffId: checkInData.staffId || 'staff-1',
    staffName: checkInData.staffName || 'Frontdesk Staff',
    accessGranted: checkInData.accessGranted !== undefined ? Boolean(checkInData.accessGranted) : true,
    notes: checkInData.notes || '',
    timestamp: new Date().toISOString(),
    verifiedAtTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  saveLocalCheckIn(newRecord);
  return {
    success: true,
    checkIn: newRecord
  };
}

let memoryCheckIns = null;

function getStoredCheckIns() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_CHECKINS_KEY);
      return raw ? JSON.parse(raw) : getSeedCheckIns();
    }
  } catch {
    // fallback
  }
  if (!memoryCheckIns) {
    memoryCheckIns = getSeedCheckIns();
  }
  return memoryCheckIns;
}

function saveLocalCheckIn(record) {
  try {
    const existing = getStoredCheckIns();
    const updated = [record, ...existing.filter(r => r.id !== record.id)].slice(0, 100);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CHECKINS_KEY, JSON.stringify(updated));
    }
    memoryCheckIns = updated;
  } catch (e) {
    console.warn('Could not save checkin to localStorage', e);
  }
}

/**
 * Retrieve today's check-ins log
 */
export async function getFrontdeskCheckIns() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/frontdesk/checkins`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return {
          logs: json.data,
          stats: json.stats
        };
      }
    }
  } catch (err) {
    console.info('Backend checkins offline, using local store:', err.message);
  }

  const logs = getStoredCheckIns();
  const totalScans = logs.length;
  const activeVerified = logs.filter(c => c.accessGranted).length;
  const expiredFlagged = logs.filter(c => !c.accessGranted || c.status === 'expired').length;

  return {
    logs,
    stats: {
      totalScans,
      activeVerified,
      expiredFlagged
    }
  };
}

function getSeedCheckIns() {
  const now = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n);
  const time1 = `${pad(now.getHours() - 1)}:15`;
  const time2 = `${pad(now.getHours() - 2)}:40`;
  const time3 = `${pad(now.getHours() - 3)}:05`;

  return [
    {
      id: 'CHK-901',
      memberId: 'MEM-8801',
      memberNumber: 'CC-2026-8801',
      memberName: 'Devon Conway',
      tier: 'Gold',
      status: 'active',
      facility: 'Tennis Court 1',
      staffName: 'Rahul Sharma',
      accessGranted: true,
      notes: 'Reserved Court #1 (14-day advance VIP slot)',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      verifiedAtTime: time1
    },
    {
      id: 'CHK-902',
      memberId: 'MEM-4920',
      memberNumber: 'CC-2026-4920',
      memberName: 'Sarah Jenkins',
      tier: 'Silver',
      status: 'active',
      facility: 'Badminton Arena #3',
      staffName: 'Rahul Sharma',
      accessGranted: true,
      notes: 'Equipment check-out at Pro Shop',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      verifiedAtTime: time2
    },
    {
      id: 'CHK-903',
      memberId: 'MEM-3104',
      memberNumber: 'CC-2026-3104',
      memberName: 'Aryan Sharma',
      tier: 'Junior',
      status: 'active',
      facility: 'Box Cricket Arena',
      staffName: 'Sneha Patel',
      accessGranted: true,
      notes: 'Youth clinic session attended with guardian',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      verifiedAtTime: time3
    }
  ];
}
