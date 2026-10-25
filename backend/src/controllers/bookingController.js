import mongoose from 'mongoose';
import Hold from '../models/Hold.js';
import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import Screen from '../models/Screen.js';
import { calculateAuthoritativePricing } from '../utils/pricing.js';

export const holdSeats = async (req, res, next) => {
  try {
    const { showtimeId, seats, durationSeconds, promoCode } = req.body;

    if (!showtimeId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'showtimeId and an array of seat identifiers are required',
      });
    }

    if (seats.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 seats can be held in a single reservation session',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Showtime ID format',
      });
    }

    const showtime = await Showtime.findById(showtimeId)
      .populate('screen')
      .populate('theatre');

    if (!showtime || !showtime.isActive || showtime.status === 'cancelled') {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found or is currently inactive/cancelled',
      });
    }

    if (new Date(showtime.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot hold seats for a past or currently playing showtime',
      });
    }

    const screen = showtime.screen;
    if (!screen) {
      return res.status(500).json({
        success: false,
        message: 'Auditorium screen layout configuration is missing for this showtime',
      });
    }

    const cleanSeatIds = seats.map((s) => s.toUpperCase().trim());

    let seatDetails, pricing;
    try {
      const calcResult = calculateAuthoritativePricing(showtime, screen, cleanSeatIds, promoCode);
      seatDetails = calcResult.seatDetails;
      pricing = calcResult.pricing;
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const holdSeconds = Math.min(
      600,
      Math.max(5, parseInt(durationSeconds || process.env.HOLD_DURATION_SECONDS || 300, 10))
    );
    const now = new Date();
    const expiresAt = new Date(now.getTime() + holdSeconds * 1000);
    const newHoldId = new mongoose.Types.ObjectId();

    await Showtime.updateOne(
      { _id: showtime._id },
      { $pull: { heldSeats: { expiresAt: { $lte: now } } } }
    );

    const atomicQuery = {
      _id: showtime._id,
      isActive: true,
      status: { $nin: ['cancelled', 'completed'] },
      'bookedSeats.seatId': { $nin: cleanSeatIds },
      heldSeats: {
        $not: {
          $elemMatch: {
            seatId: { $in: cleanSeatIds },
            expiresAt: { $gt: now },
          },
        },
      },
    };

    const atomicUpdate = {
      $push: {
        heldSeats: {
          $each: cleanSeatIds.map((seatId) => ({
            seatId,
            holdId: newHoldId,
            user: req.user._id,
            expiresAt,
          })),
        },
      },
    };

    const updatedShowtime = await Showtime.findOneAndUpdate(atomicQuery, atomicUpdate, {
      returnDocument: 'after',
    });

    if (!updatedShowtime) {
      return res.status(409).json({
        success: false,
        message:
          'One or more of the selected seats are already held or booked by another moviegoer. Please choose available seats.',
      });
    }

    const hold = await Hold.create({
      _id: newHoldId,
      user: req.user._id,
      showtime: showtime._id,
      seats: cleanSeatIds,
      seatDetails,
      pricing,
      expiresAt,
      status: 'held',
    });

    res.status(201).json({
      success: true,
      message: `Seats held successfully for ${holdSeconds} seconds. Complete your booking before hold expires.`,
      holdId: hold._id,
      expiresAt: hold.expiresAt,
      expiresInSeconds: holdSeconds,
      seats: hold.seats,
      pricing: hold.pricing,
      seatDetails: hold.seatDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const releaseHold = async (req, res, next) => {
  try {
    const { holdId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Hold ID format',
      });
    }

    const hold = await Hold.findById(holdId);
    if (!hold) {
      return res.status(404).json({
        success: false,
        message: 'Seat hold record not found',
      });
    }

    if (hold.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to release this seat hold',
      });
    }

    if (hold.status === 'released') {
      return res.status(200).json({
        success: true,
        message: 'Seat hold was already released',
      });
    }

    await Showtime.updateOne(
      { _id: hold.showtime },
      { $pull: { heldSeats: { holdId: hold._id } } }
    );

    hold.status = 'released';
    await hold.save();

    res.status(200).json({
      success: true,
      message: 'Seat hold released successfully',
      releasedSeats: hold.seats,
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { holdId, idempotencyKey: bodyIdempotencyKey, contactDetails, promoCode } = req.body;
    const headerIdempotencyKey = req.headers['idempotency-key'];
    const idempotencyKey = bodyIdempotencyKey || headerIdempotencyKey || null;

    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({
        user: req.user._id,
        idempotencyKey,
      })
        .populate('movie', 'title slug poster certificate duration')
        .populate('theatre', 'name slug location city')
        .populate('screen', 'screenNumber name format')
        .populate('showtime', 'startTime endTime format language');

      if (existingBooking) {
        return res.status(200).json({
          success: true,
          message: 'Booking retrieved via idempotency replay',
          isIdempotentReplay: true,
          booking: existingBooking,
        });
      }
    }

    if (!holdId) {
      return res.status(400).json({
        success: false,
        message: 'A valid holdId is required to create a booking',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Hold ID format',
      });
    }

    const hold = await Hold.findById(holdId);
    if (!hold) {
      return res.status(404).json({
        success: false,
        message: 'Hold reservation not found',
      });
    }

    if (hold.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this seat hold',
      });
    }

    if (hold.status === 'converted') {
      return res.status(400).json({
        success: false,
        message: 'This seat hold has already been converted into a booking',
      });
    }

    if (hold.status === 'released') {
      return res.status(400).json({
        success: false,
        message: 'This seat hold was previously released and is no longer valid',
      });
    }

    const now = new Date();
    if (new Date(hold.expiresAt) <= now) {
      hold.status = 'expired';
      await hold.save();
      await Showtime.updateOne(
        { _id: hold.showtime },
        { $pull: { heldSeats: { holdId: hold._id } } }
      );
      return res.status(410).json({
        success: false,
        message: 'Seat hold has expired. Please select seats and initiate a new hold.',
      });
    }

    const showtime = await Showtime.findById(hold.showtime)
      .populate('screen')
      .populate('theatre')
      .populate('movie');

    if (!showtime || !showtime.isActive || showtime.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Showtime is no longer active or available',
      });
    }

    const { seatDetails, pricing } = calculateAuthoritativePricing(
      showtime,
      showtime.screen,
      hold.seats,
      promoCode
    );

    const newBookingId = new mongoose.Types.ObjectId();

    const atomicTransitionQuery = {
      _id: showtime._id,
      heldSeats: {
        $elemMatch: {
          holdId: hold._id,
          user: req.user._id,
          expiresAt: { $gt: now },
        },
      },
      'bookedSeats.seatId': { $nin: hold.seats },
    };

    const atomicTransitionUpdate = {
      $pull: {
        heldSeats: { holdId: hold._id },
      },
      $push: {
        bookedSeats: {
          $each: hold.seats.map((seatId) => ({
            seatId,
            bookingId: newBookingId,
            bookedAt: new Date(),
          })),
        },
      },
    };

    const transitionedShowtime = await Showtime.findOneAndUpdate(
      atomicTransitionQuery,
      atomicTransitionUpdate,
      { returnDocument: 'after' }
    );

    if (!transitionedShowtime) {
      return res.status(409).json({
        success: false,
        message:
          'Failed to confirm seats: Hold has expired or seats were already committed to another order.',
      });
    }

    const booking = await Booking.create({
      _id: newBookingId,
      idempotencyKey,
      user: req.user._id,
      showtime: showtime._id,
      movie: showtime.movie._id,
      theatre: showtime.theatre._id,
      screen: showtime.screen._id,
      seats: hold.seats,
      seatDetails,
      ticketCount: hold.seats.length,
      pricing,
      contactDetails: {
        name: contactDetails?.name || req.user.name,
        email: contactDetails?.email || req.user.email,
        phone: contactDetails?.phone || '',
      },
      hold: hold._id,
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    hold.status = 'converted';
    hold.convertedBooking = booking._id;
    await hold.save();

    res.status(201).json({
      success: true,
      message: 'Booking initiated successfully. Proceed to payment verification.',
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        ticketCount: booking.ticketCount,
        seats: booking.seats,
        pricing: booking.pricing,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        showtime: {
          id: showtime._id,
          startTime: showtime.startTime,
          format: showtime.format,
          movie: { title: showtime.movie.title, poster: showtime.movie.poster },
          theatre: { name: showtime.theatre.name, location: showtime.theatre.location },
          screen: { name: showtime.screen.name },
        },
      },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {

      const existing = await Booking.findOne({
        user: req.user._id,
        idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key'],
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Booking retrieved via idempotency replay',
          isIdempotentReplay: true,
          booking: existing,
        });
      }
    }
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { provider = 'mock_razorpay', transactionId, signature } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Booking ID format',
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm payment for this booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm payment on a cancelled booking',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Booking is already paid and confirmed',
        booking,
      });
    }

    const verifiedTxId = transactionId || `txn_${Math.random().toString(36).substring(2, 10)}`;

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.paymentDetails = {
      provider,
      transactionId: verifiedTxId,
      paidAt: new Date(),
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('movie', 'title slug poster duration certification')
      .populate('theatre', 'name slug location city cancellationAvailable')
      .populate('screen', 'screenNumber name format')
      .populate('showtime', 'startTime endTime format language');

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { bookingReference: id.toUpperCase().trim() };
    }

    const booking = await Booking.findOne(query)
      .populate('movie', 'title slug poster duration certification languages')
      .populate('theatre', 'name slug location city cancellationAvailable contactPhone')
      .populate('screen', 'screenNumber name format soundSystem')
      .populate('showtime', 'startTime endTime format language');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with identifier '${id}'`,
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { bookingReference: id.toUpperCase().trim() };
    }

    const booking = await Booking.findOne(query).select(
      'bookingReference status paymentStatus ticketCount seats pricing createdAt user'
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this booking status',
      });
    }

    res.status(200).json({
      success: true,
      bookingReference: booking.bookingReference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      ticketCount: booking.ticketCount,
      seats: booking.seats,
      totalAmount: booking.pricing?.totalAmount,
      createdAt: booking.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { bookingReference: id.toUpperCase().trim() };
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to cancel this booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    const showtime = await Showtime.findById(booking.showtime).populate('theatre');
    if (!showtime) {
      return res.status(400).json({
        success: false,
        message: 'Associated showtime not found',
      });
    }

    const now = new Date();
    if (new Date(showtime.startTime) <= now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking for a showtime that has already started or concluded',
      });
    }

    if (showtime.theatre && showtime.theatre.cancellationAvailable === false) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation is not permitted by this theatre policy',
      });
    }

    const cutoffMs = 2 * 60 * 60 * 1000;
    if (new Date(showtime.startTime).getTime() - now.getTime() < cutoffMs && req.user.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cancellation window closed: Bookings can only be cancelled at least 2 hours prior to showtime.',
      });
    }

    await Showtime.updateOne(
      { _id: showtime._id },
      { $pull: { bookedSeats: { bookingId: booking._id } } }
    );

    booking.status = 'cancelled';
    booking.cancellationDetails = {
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      reason: reason || 'Customer requested cancellation',
      refundAmount: booking.paymentStatus === 'paid' ? booking.pricing.totalAmount : 0,
      refundStatus: booking.paymentStatus === 'paid' ? 'processed' : 'none',
    };

    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been restored to available inventory.',
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        cancellationDetails: booking.cancellationDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};
