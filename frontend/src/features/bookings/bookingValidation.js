/**
 * Champions Club - Booking Validation Helpers
 * Role: MEMBER 1 (Member Booking Experience)
 * 
 * Enforces problem rules:
 * - 1-hour sessions
 * - 30-minute starting intervals (e.g. 06:00, 06:30, 07:00)
 * - Required court, date, start time
 * - Max 2 member plays per day limit checks
 * - Active membership validity checks
 */

/**
 * Standard Club Operating Hours: 06:00 AM to 11:00 PM (23:00)
 * Generates all valid 30-minute interval start times.
 */
export const CLUB_START_TIMES = [
  '06:00', '06:30',
  '07:00', '07:30',
  '08:00', '08:30',
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00', '20:30',
  '21:00', '21:30',
  '22:00'
];

/**
 * Given a HH:MM start time, calculate the 1-hour end time (HH:MM).
 */
export function calculateOneHourEndTime(startTimeStr) {
  if (!startTimeStr || !startTimeStr.includes(':')) return '';
  const [hourStr, minStr] = startTimeStr.split(':');
  const h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  const endH = h + 1;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Validate that a time string adheres strictly to 30-minute intervals.
 */
export function isThirtyMinuteInterval(timeStr) {
  if (!timeStr) return false;
  let timeOnly = timeStr;
  if (timeStr.includes('T')) {
    // ISO string or similar: extract HH:MM
    const parts = timeStr.split('T')[1].split(':');
    timeOnly = `${parts[0]}:${parts[1]}`;
  }
  const parts = timeOnly.split(':');
  if (parts.length < 2) return false;
  const minutes = parseInt(parts[1], 10);
  return minutes === 0 || minutes === 30;
}

/**
 * Validate that a duration between two ISO or HH:MM times is exactly 1 hour (60 minutes).
 */
export function isExactlyOneHour(startTime, endTime) {
  if (!startTime || !endTime) return false;
  
  if (startTime.includes('T') && endTime.includes('T')) {
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();
    return (e - s) === (60 * 60 * 1000);
  }

  // Handle HH:MM strings
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  return diffMinutes === 60;
}

/**
 * Client-side validation of booking input before submission
 */
export function validateBookingInput({
  courtId,
  bookingDate,
  date,
  startTime,
  endTime,
  memberId,
  member,
  dailyUsage
}) {
  const errors = {};
  const effectiveDate = bookingDate || date;

  if (!courtId) {
    errors.courtId = 'Court selection is required';
  }

  if (!effectiveDate) {
    errors.bookingDate = 'Booking date is required';
  } else {
    // Date cannot be in the past
    const today = new Date().toISOString().split('T')[0];
    if (effectiveDate < today) {
      errors.bookingDate = 'Booking date cannot be in the past';
    }
  }

  if (!startTime) {
    errors.startTime = 'Start time is required';
  } else if (!isThirtyMinuteInterval(startTime)) {
    errors.startTime = 'Only 30-minute start times are permitted (e.g. 06:00, 06:30)';
  }

  if (!endTime) {
    errors.endTime = 'End time is required';
  } else if (startTime && !isExactlyOneHour(startTime, endTime)) {
    errors.endTime = 'Sessions must be exactly one hour in duration';
  }

  // Daily usage limit check (max 2 plays per day per member)
  if (dailyUsage !== undefined && dailyUsage !== null) {
    const usedCount = typeof dailyUsage === 'number' ? dailyUsage : (dailyUsage.usedCount || 0);
    if (usedCount >= 2) {
      errors.dailyLimit = 'Daily limit exceeded: Maximum 2 court sessions per member per day';
    }
  }

  // Membership status check
  if (member) {
    const status = member.status || member.activeMembership?.status;
    if (status === 'expired' || status === 'suspended' || status === 'inactive') {
      errors.membership = `Member status is '${status}'. Active membership required to book courts.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Computes slot availability matrix for 30-minute intervals given existing bookings
 */
export function buildThirtyMinuteSlotGrid(court, date, existingBookings = []) {
  if (!court || !date) return [];

  return CLUB_START_TIMES.map((startTime) => {
    const endTime = calculateOneHourEndTime(startTime);
    const startIso = `${date}T${startTime}:00.000Z`;
    const endIso = `${date}T${endTime}:00.000Z`;

    const slotStart = new Date(startIso).getTime();
    const slotEnd = new Date(endIso).getTime();

    // Check overlap against confirmed bookings
    const conflictingBooking = existingBookings.find((b) => {
      if (b.status === 'cancelled' || b.status === 'no_show') return false;
      // Match court
      if (b.courtId && b.courtId !== court.id && b.court_id !== court.id) return false;
      const bStart = new Date(b.startTime || b.start_time).getTime();
      const bEnd = new Date(b.endTime || b.end_time).getTime();
      return bStart < slotEnd && bEnd > slotStart;
    });

    let available = true;
    let status = 'Available';

    if (conflictingBooking) {
      available = false;
      const type = conflictingBooking.bookingType || conflictingBooking.booking_type;
      if (type === 'social_mixer') {
        status = 'Social Play (Open Mixer)';
      } else if (type === 'trial') {
        status = 'Trial Session';
      } else if (type === 'maintenance') {
        status = 'Maintenance';
      } else {
        status = 'Booked';
      }
    }

    const startH = parseInt(startTime.split(':')[0], 10);
    const isPrime = startH >= 17 && startH < 21;

    return {
      id: `${court.id}-${startTime.replace(':', '')}-${endTime.replace(':', '')}`,
      startTime,
      endTime,
      startIso,
      endIso,
      timeLabel: `${startTime} - ${endTime}`,
      duration: '1 Hour',
      available,
      status,
      conflictingBooking: conflictingBooking ? {
        id: conflictingBooking.id,
        bookingNumber: conflictingBooking.bookingNumber || conflictingBooking.booking_number,
        bookingType: conflictingBooking.bookingType || conflictingBooking.booking_type
      } : null,
      isPrime,
      hourlyRate: court.hourlyRate || 800,
      memberRate: court.memberRate || 400,
      goldRate: court.goldRate || 0
    };
  });
}
