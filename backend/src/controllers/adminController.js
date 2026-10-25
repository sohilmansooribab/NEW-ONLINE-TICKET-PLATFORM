import mongoose from 'mongoose';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Theatre from '../models/Theatre.js';
import Showtime from '../models/Showtime.js';
import Movie from '../models/Movie.js';

export const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role && ['USER', 'ORGANIZER', 'ADMIN'].includes(role.toUpperCase())) {
      filter.role = role.toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const bookingsCount = await Booking.countDocuments({ user: u._id });
        const userObj = u.toJSON();
        userObj.bookingsCount = bookingsCount;
        return userObj;
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      users: usersWithStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [bookings, totalSpentAgg] = await Promise.all([
      Booking.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('movie', 'title poster')
        .populate('theatre', 'name city'),
      Booking.aggregate([
        { $match: { user: user._id, paymentStatus: 'paid', status: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalSpent: { $sum: '$pricing.totalAmount' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalBookings: await Booking.countDocuments({ user: user._id }),
        totalSpent: totalSpentAgg[0]?.totalSpent || 0,
      },
      recentBookings: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format',
      });
    }

    if (!role || !['USER', 'ORGANIZER', 'ADMIN'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Role must be 'USER', 'ORGANIZER', or 'ADMIN'",
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const newRole = role.toUpperCase();

    if (targetUser._id.toString() === req.user._id.toString() && newRole !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Security constraint: Administrators cannot demote their own account.',
      });
    }

    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the sole remaining Administrator on the system.',
        });
      }
    }

    targetUser.role = newRole;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User '${targetUser.email}' role updated to '${newRole}' successfully`,
      user: targetUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format',
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own active account',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (targetUser.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the sole remaining Administrator on the system',
        });
      }
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User account '${targetUser.email}' removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTheatreOrganizer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { organizerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Theatre ID format',
      });
    }

    const theatre = await Theatre.findById(id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    if (organizerId === null) {

      theatre.organizer = null;
      await theatre.save();
      return res.status(200).json({
        success: true,
        message: `Organizer unassigned from '${theatre.name}' successfully`,
        theatre,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organizerId format',
      });
    }

    const organizer = await User.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Target organizer user not found',
      });
    }

    if (organizer.role !== 'ORGANIZER' && organizer.role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: `User '${organizer.email}' does not have the 'ORGANIZER' or 'ADMIN' role. Current role: '${organizer.role}'`,
      });
    }

    theatre.organizer = organizer._id;
    await theatre.save();

    res.status(200).json({
      success: true,
      message: `Theatre '${theatre.name}' assigned to organizer '${organizer.name}' successfully`,
      theatre,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminBookings = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      theatre,
      movie,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (theatre && mongoose.Types.ObjectId.isValid(theatre)) filter.theatre = theatre;
    if (movie && mongoose.Types.ObjectId.isValid(movie)) filter.movie = movie;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { bookingReference: searchRegex },
        { 'contactDetails.name': searchRegex },
        { 'contactDetails.email': searchRegex },
        { 'paymentDetails.transactionId': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email role')
        .populate('movie', 'title poster duration')
        .populate('theatre', 'name location city')
        .populate('screen', 'screenNumber name format')
        .populate('showtime', 'startTime endTime format language'),
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

export const getAdminAnalytics = async (req, res, next) => {
  try {

    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalBaseRevenue: { $sum: '$pricing.baseAmount' },
          totalFees: { $sum: '$pricing.convenienceFee' },
          totalTicketsSold: { $sum: '$ticketCount' },
          totalPaidBookings: { $sum: 1 },
        },
      },
    ]);

    const settledRevenue = revenueAgg[0]?.totalRevenue || 0;
    const settledTickets = revenueAgg[0]?.totalTicketsSold || 0;
    const totalPaidBookings = revenueAgg[0]?.totalPaidBookings || 0;

    const statusAgg = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const bookingsByStatus = {
      confirmed: 0,
      pending_payment: 0,
      cancelled: 0,
      expired: 0,
    };
    statusAgg.forEach((item) => {
      if (item._id) bookingsByStatus[item._id] = item.count;
    });

    const userRoleAgg = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const usersByRole = {
      USER: 0,
      ORGANIZER: 0,
      ADMIN: 0,
    };
    userRoleAgg.forEach((item) => {
      if (item._id) usersByRole[item._id] = item.count;
    });

    const topMoviesAgg = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$movie',
          revenue: { $sum: '$pricing.totalAmount' },
          tickets: { $sum: '$ticketCount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movieDetails',
        },
      },
      { $unwind: '$movieDetails' },
      {
        $project: {
          _id: 1,
          title: '$movieDetails.title',
          slug: '$movieDetails.slug',
          poster: '$movieDetails.poster',
          revenue: 1,
          tickets: 1,
          orders: 1,
        },
      },
    ]);

    const topTheatresAgg = await Booking.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$theatre',
          revenue: { $sum: '$pricing.totalAmount' },
          tickets: { $sum: '$ticketCount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'theatres',
          localField: '_id',
          foreignField: '_id',
          as: 'theatreDetails',
        },
      },
      { $unwind: '$theatreDetails' },
      {
        $project: {
          _id: 1,
          name: '$theatreDetails.name',
          city: '$theatreDetails.city',
          revenue: 1,
          tickets: 1,
          orders: 1,
        },
      },
    ]);

    const [totalTheatres, totalMovies, totalShowtimes, totalBookings] = await Promise.all([
      Theatre.countDocuments({ isActive: true }),
      Movie.countDocuments({ isPublished: true }),
      Showtime.countDocuments({ isActive: true }),
      Booking.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalSettledRevenue: settledRevenue,
        settledRevenue,
        settledTickets,
        totalPaidBookings,
        totalBookings,
        totalTheatres,
        totalMovies,
        totalShowtimes,
      },
      settledMetrics: {
        settledRevenue,
        settledTickets,
        totalPaidBookings,
        averageOrderValue: totalPaidBookings > 0 ? Math.round(settledRevenue / totalPaidBookings) : 0,
      },
      platformCounts: {
        totalTheatres,
        totalMovies,
        totalShowtimes,
        totalBookings,
      },
      bookingsByStatus,
      usersByRole,
      topMovies: topMoviesAgg,
      topTheatres: topTheatresAgg,
    });
  } catch (error) {
    next(error);
  }
};
