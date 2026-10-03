/**
 * Champions Club - Court Bookings Controller
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const bookingService = require('./bookingService');
const { validateCreateBooking } = require('./bookingValidators');

class BookingController {
  async getCourts(req, res, next) {
    try {
      const courts = await bookingService.getCourts();
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
        return res.status(422).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid booking parameters',
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
        notes
      } = req.body;

      // Extract memberId from authenticated user if logged in
      const effectiveMemberId = req.user?.memberId || memberId || null;

      const booking = await bookingService.createBooking({
        courtId,
        memberId: effectiveMemberId,
        guestName: guestName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Guest Player'),
        guestEmail: guestEmail || req.user?.email || null,
        guestPhone: guestPhone || req.user?.phone || null,
        bookingDate: bookingDate || date,
        startTime,
        endTime,
        bookingType: bookingType || 'ordinary',
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

  async list(req, res, next) {
    try {
      const { courtId, date, status, limit, offset } = req.query;
      const memberId = req.user?.role === 'member' ? req.user.memberId : req.query.memberId;

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
      const { reason } = req.body;
      const cancelled = await bookingService.cancelBooking(id, reason);
      res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Booking cancelled successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();
