/**
 * Champions Club - Court Bookings Controller
 * Role: MEMBER 3 (Booking Engine Backend)
 */

const bookingService = require('./bookingService');
const { validateCreateBooking } = require('./bookingValidators');

class BookingController {
  async getSports(req, res, next) {
    try {
      const sports = await bookingService.getSports();
      res.status(200).json(sports);
    } catch (err) {
      next(err);
    }
  }

  async getCourts(req, res, next) {
    try {
      const { sportId, sport } = req.query;
      const courts = await bookingService.getCourts(sportId || sport);
      res.status(200).json(courts);
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const { courtId, date } = req.query;
      const availability = await bookingService.getCourtAvailability(
        courtId || 'court-1',
        date || new Date().toISOString().split('T')[0]
      );
      res.status(200).json(availability);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const validation = validateCreateBooking(req.body);
      if (!validation.isValid) {
        return res.status(validation.isSlotError ? 400 : 422).json({
          success: false,
          error: validation.isSlotError ? 'Invalid Booking Slot' : 'Validation Error',
          code: validation.isSlotError ? 'INVALID_BOOKING_SLOT' : 'VALIDATION_FAILED',
          message: validation.errors[0]?.message || 'Invalid booking parameters',
          errors: validation.errors
        });
      }

      const {
        courtId,
        bookingDate,
        date,
        startTime,
        endTime,
        memberId,
        guestName,
        guestEmail,
        guestPhone,
        bookingType,
        participants,
        notes
      } = req.body;

      // Extract memberId from authenticated user if member session
      const effectiveMemberId = req.user?.role === 'member'
        ? (req.user.memberId || req.user.id)
        : (memberId || req.user?.memberId || null);

      const booking = await bookingService.createBooking({
        courtId,
        memberId: effectiveMemberId,
        guestName: guestName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : null),
        guestEmail: guestEmail || req.user?.email || null,
        guestPhone: guestPhone || req.user?.phone || null,
        bookingDate: bookingDate || date,
        startTime,
        endTime,
        bookingType: bookingType || 'ordinary',
        participants: participants || [],
        notes
      });

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Court booking confirmed successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id);
      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const { courtId, date, status, limit, offset } = req.query;
      const memberId = req.user?.role === 'member' ? (req.user.memberId || req.user.id) : req.query.memberId;

      const bookings = await bookingService.getBookings({
        memberId,
        courtId,
        date,
        status,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        data: bookings,
        count: bookings.length
      });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const cancelled = await bookingService.cancelBooking(id, reason || 'Cancelled by user');
      res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Booking cancelled successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async addParticipant(req, res, next) {
    try {
      const { id } = req.params;
      const { memberId, name } = req.body;
      const participant = await bookingService.addParticipant(id, { memberId, name });
      res.status(201).json({
        success: true,
        data: participant,
        message: 'Participant added to session successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemberUsage(req, res, next) {
    try {
      const { id } = req.params;
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const usage = await bookingService.getMemberBookingUsage(id, date);
      res.status(200).json({
        success: true,
        ...usage,
        data: usage
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
