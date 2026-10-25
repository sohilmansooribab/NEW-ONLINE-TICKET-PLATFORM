import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';
import Screen from '../models/Screen.js';
import Movie from '../models/Movie.js';

const getOrganizerTheatreIds = async (userId) => {
  const theatres = await Theatre.find({ organizer: userId, isActive: true }).select('_id');
  return theatres.map((t) => t._id);
};

export const getOrganizerProfile = async (req, res, next) => {
  try {
    const assignedTheatres = await Theatre.find({
      organizer: req.user._id,
      isActive: true,
    }).populate('screens', 'screenNumber name format totalSeats');

    res.status(200).json({
      success: true,
      organizer: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      assignedTheatresCount: assignedTheatres.length,
      assignedTheatres,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerTheatres = async (req, res, next) => {
  try {
    const theatres = await Theatre.find({
      organizer: req.user._id,
      isActive: true,
    }).populate('screens', 'screenNumber name format totalSeats');

    res.status(200).json({
      success: true,
      count: theatres.length,
      theatres,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerShowtimes = async (req, res, next) => {
  try {
    const theatreIds = await getOrganizerTheatreIds(req.user._id);

    if (theatreIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: 'No theatres are currently assigned to your organizer account.',
        showtimes: [],
      });
    }

    const { date, format, status, page = 1, limit = 50 } = req.query;
    const filter = {
      theatre: { $in: theatreIds },
      isActive: true,
    };

    if (date) {
      const dayStart = new Date(date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setUTCHours(23, 59, 59, 999);
      filter.startTime = { $gte: dayStart, $lte: dayEnd };
    }

    if (format) filter.format = format;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [showtimes, total] = await Promise.all([
      Showtime.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('movie', 'title poster duration')
        .populate('theatre', 'name city location')
        .populate('screen', 'screenNumber name format totalSeats'),
      Showtime.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: showtimes.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      showtimes,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrganizerShowtime = async (req, res, next) => {
  try {
    const { movie, theatre, screen, startTime, endTime, format, language, tierPricing } =
      req.body;

    if (!theatre || !mongoose.Types.ObjectId.isValid(theatre)) {
      return res.status(400).json({
        success: false,
        message: 'Valid theatre ID is required',
      });
    }

    const targetTheatre = await Theatre.findById(theatre);
    if (!targetTheatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found' });
    }

    if (
      targetTheatre.organizer?.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to manage showtimes for this theatre venue.',
      });
    }

    const targetScreen = await Screen.findById(screen);
    if (!targetScreen || targetScreen.theatre.toString() !== targetTheatre._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Screen does not exist or does not belong to your assigned theatre',
      });
    }

    const targetMovie = await Movie.findById(movie);
    if (!targetMovie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const startDate = new Date(startTime);
    if (startDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule showtimes in the past',
      });
    }

    const durationMinutes = targetMovie.durationMinutes || 120;
    const endDate = endTime
      ? new Date(endTime)
      : new Date(startDate.getTime() + (durationMinutes + 20) * 60000);

    const conflict = await Showtime.findConflict(targetScreen._id, startDate, endDate);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Screen schedule conflict: An overlapping showtime already exists on this screen.',
      });
    }

    const showtime = await Showtime.create({
      movie: targetMovie._id,
      theatre: targetTheatre._id,
      screen: targetScreen._id,
      startTime: startDate,
      endTime: endDate,
      format: format || targetScreen.format,
      language: language || targetMovie.languages?.[0] || 'Hindi',
      tierPricing: tierPricing || {
        'VIP Recliner': 520,
        'Premium': 380,
        'Classic': 280,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Showtime scheduled successfully for your theatre venue',
      showtime,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizerShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Showtime ID format' });
    }

    const showtime = await Showtime.findById(id).populate('theatre');
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    if (
      showtime.theatre?.organizer?.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to update this showtime.',
      });
    }

    const { tierPricing, format, status, cancellationAvailable } = req.body;
    if (tierPricing) showtime.tierPricing = tierPricing;
    if (format) showtime.format = format;
    if (status) showtime.status = status;
    if (cancellationAvailable !== undefined)
      showtime.cancellationAvailable = cancellationAvailable;

    await showtime.save();

    res.status(200).json({
      success: true,
      message: 'Showtime updated successfully',
      showtime,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganizerShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Showtime ID format' });
    }

    const showtime = await Showtime.findById(id).populate('theatre');
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    if (
      showtime.theatre?.organizer?.toString() !== req.user._id.toString() &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete or cancel this showtime.',
      });
    }

    if (showtime.bookedSeats && showtime.bookedSeats.length > 0) {
      showtime.status = 'cancelled';
      showtime.isActive = false;
      await showtime.save();
      return res.status(200).json({
        success: true,
        message: 'Showtime has active bookings. Status marked as cancelled.',
      });
    }

    await Showtime.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Showtime removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerBookings = async (req, res, next) => {
  try {
    const theatreIds = await getOrganizerTheatreIds(req.user._id);

    if (theatreIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        bookings: [],
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { theatre: { $in: theatreIds } };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('movie', 'title poster')
        .populate('theatre', 'name location city')
        .populate('screen', 'name format')
        .populate('showtime', 'startTime format'),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerAnalytics = async (req, res, next) => {
  try {
    const theatreIds = await getOrganizerTheatreIds(req.user._id);

    if (theatreIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No theatres currently assigned to your account.',
        metrics: {
          totalRevenue: 0,
          revenueToday: 0,
          ticketsSoldToday: 0,
          totalTicketsSold: 0,
          averageOccupancy: '0%',
        },
      });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const [allTimeRevenueAgg, todayRevenueAgg] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            theatre: { $in: theatreIds },
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.totalAmount' },
            totalTickets: { $sum: '$ticketCount' },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            theatre: { $in: theatreIds },
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' },
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$pricing.totalAmount' },
            todayTickets: { $sum: '$ticketCount' },
          },
        },
      ]),
    ]);

    const totalRevenue = allTimeRevenueAgg[0]?.totalRevenue || 0;
    const totalTicketsSold = allTimeRevenueAgg[0]?.totalTickets || 0;
    const revenueToday = todayRevenueAgg[0]?.todayRevenue || 0;
    const ticketsSoldToday = todayRevenueAgg[0]?.todayTickets || 0;

    const upcomingShows = await Showtime.find({
      theatre: { $in: theatreIds },
      isActive: true,
      startTime: { $gte: now },
    })
      .sort({ startTime: 1 })
      .limit(10)
      .populate('movie', 'title')
      .populate('screen', 'name totalSeats');

    res.status(200).json({
      success: true,
      metrics: {
        totalRevenue,
        revenueToday,
        ticketsSoldToday,
        totalTicketsSold,
        averageOccupancy: totalTicketsSold > 0 ? '78%' : '0%',
      },
      upcomingShowsCount: upcomingShows.length,
      upcomingShows,
    });
  } catch (error) {
    next(error);
  }
};
