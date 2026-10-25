import mongoose from 'mongoose';
import Showtime from '../models/Showtime.js';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import Screen from '../models/Screen.js';

export const getShowtimes = async (req, res, next) => {
  try {
    const {
      movie,
      theatre,
      screen,
      city,
      date,
      format,
      status,
      upcoming,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { isActive: true };

    if (movie) {
      if (mongoose.Types.ObjectId.isValid(movie)) {
        filter.movie = movie;
      } else {
        const foundMovie = await Movie.findOne({ slug: movie.toLowerCase().trim() });
        if (foundMovie) {
          filter.movie = foundMovie._id;
        } else {
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: { total: 0, page: 1, limit: 50, pages: 1 },
            showtimes: [],
          });
        }
      }
    }

    if (theatre) {
      if (mongoose.Types.ObjectId.isValid(theatre)) {
        filter.theatre = theatre;
      } else {
        const foundTheatre = await Theatre.findOne({ slug: theatre.toLowerCase().trim() });
        if (foundTheatre) {
          filter.theatre = foundTheatre._id;
        } else {
          return res.status(200).json({
            success: true,
            count: 0,
            pagination: { total: 0, page: 1, limit: 50, pages: 1 },
            showtimes: [],
          });
        }
      }
    }

    if (screen && mongoose.Types.ObjectId.isValid(screen)) {
      filter.screen = screen;
    }

    if (city && city.toLowerCase() !== 'all') {
      const theatresInCity = await Theatre.find({
        city: city.toLowerCase().trim(),
        isActive: true,
      }).select('_id');
      const theatreIds = theatresInCity.map((t) => t._id);
      if (theatreIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          pagination: { total: 0, page: 1, limit: 50, pages: 1 },
          showtimes: [],
        });
      }
      filter.theatre = { $in: theatreIds };
    }

    if (date) {
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD or standard ISO date string.',
        });
      }
      const dayStart = new Date(date);
      dayStart.setUTCHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setUTCHours(23, 59, 59, 999);

      filter.startTime = { $gte: dayStart, $lte: dayEnd };
    } else if (upcoming === 'true') {
      filter.startTime = { $gte: new Date() };
    }

    if (format && format !== 'All Formats') {
      filter.format = format;
    }

    if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [showtimes, total] = await Promise.all([
      Showtime.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('movie', 'title slug poster duration certification rating languages genres')
        .populate('theatre', 'name slug location city distance amenities cancellationAvailable')
        .populate('screen', 'screenNumber name format soundSystem totalSeats'),
      Showtime.countDocuments(filter),
    ]);

    const enhancedShowtimes = showtimes.map((st) => {
      const showObj = st.toObject();
      const bookedCount = showObj.bookedSeats ? showObj.bookedSeats.length : 0;
      const totalSeats = showObj.screen?.totalSeats || 142;
      const availableSeats = Math.max(0, totalSeats - bookedCount);
      const occupancyRate = Math.round((bookedCount / totalSeats) * 100);

      let computedStatus = showObj.status;
      if (showObj.status !== 'cancelled') {
        if (availableSeats === 0) computedStatus = 'sold-out';
        else if (occupancyRate >= 80) computedStatus = 'almost-full';
        else if (occupancyRate >= 50) computedStatus = 'fast-filling';
        else computedStatus = 'available';
      }

      showObj.stats = {
        totalSeats,
        bookedCount,
        availableSeats,
        occupancyRate,
      };
      showObj.computedStatus = computedStatus;
      return showObj;
    });

    res.status(200).json({
      success: true,
      count: enhancedShowtimes.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      showtimes: enhancedShowtimes,
    });
  } catch (error) {
    next(error);
  }
};

export const getShowtimeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Showtime ID format',
      });
    }

    const showtime = await Showtime.findById(id)
      .populate('movie')
      .populate('theatre')
      .populate('screen');

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    const showObj = showtime.toObject();
    const totalSeats = showObj.screen?.totalSeats || 142;
    const bookedCount = showObj.bookedSeats ? showObj.bookedSeats.length : 0;
    const availableSeats = Math.max(0, totalSeats - bookedCount);

    showObj.stats = {
      totalSeats,
      bookedCount,
      availableSeats,
      occupancyRate: Math.round((bookedCount / totalSeats) * 100),
    };

    res.status(200).json({
      success: true,
      showtime: showObj,
    });
  } catch (error) {
    next(error);
  }
};

export const getShowtimeSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Showtime ID format',
      });
    }

    const showtime = await Showtime.findById(id)
      .populate('movie', 'title slug poster duration certification rating')
      .populate('theatre', 'name slug location city cancellationAvailable')
      .populate('screen');

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    const screen = showtime.screen;
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen information for this showtime is missing',
      });
    }

    const bookedSeatIds = new Set(showtime.bookedSeats.map((b) => b.seatId.toUpperCase()));

    const now = new Date();
    const activeHeldSeats = (showtime.heldSeats || []).filter(
      (h) => new Date(h.expiresAt) > now
    );
    const heldSeatIds = new Set(activeHeldSeats.map((h) => h.seatId.toUpperCase()));

    const seatsWithLiveStatus = screen.seats.map((seat) => {
      const isBooked = bookedSeatIds.has(seat.seatId.toUpperCase());
      const isHeld = heldSeatIds.has(seat.seatId.toUpperCase());
      const price =
        showtime.tierPricing?.[seat.tier] !== undefined
          ? showtime.tierPricing[seat.tier]
          : seat.tier === 'VIP Recliner'
          ? 520
          : seat.tier === 'Premium'
          ? 380
          : 280;

      return {
        id: seat.seatId,
        seatId: seat.seatId,
        row: seat.row,
        number: seat.number,
        tier: seat.tier,
        price,
        status: isBooked ? 'occupied' : isHeld ? 'held' : 'available',
        isBooked,
        isHeld,
      };
    });

    const rowsMap = new Map();
    for (const seat of seatsWithLiveStatus) {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, {
          row: seat.row,
          tier: seat.tier,
          price: seat.price,
          seats: [],
        });
      }
      rowsMap.get(seat.row).seats.push(seat);
    }
    const layoutRows = Array.from(rowsMap.values());

    const totalSeats = screen.totalSeats || seatsWithLiveStatus.length;
    const bookedCount = bookedSeatIds.size;
    const heldCount = heldSeatIds.size;
    const availableCount = Math.max(0, totalSeats - bookedCount - heldCount);
    const occupancyRate = Math.round(((bookedCount + heldCount) / totalSeats) * 100);

    let computedStatus = showtime.status;
    if (showtime.status !== 'cancelled') {
      if (availableCount === 0) computedStatus = 'sold-out';
      else if (occupancyRate >= 80) computedStatus = 'almost-full';
      else if (occupancyRate >= 50) computedStatus = 'fast-filling';
      else computedStatus = 'available';
    }

    res.status(200).json({
      success: true,
      showtime: {
        id: showtime._id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        format: showtime.format,
        language: showtime.language,
        status: computedStatus,
        cancellationAvailable: showtime.cancellationAvailable,
        movie: showtime.movie,
        theatre: showtime.theatre,
        screen: {
          id: screen._id,
          name: screen.name,
          format: screen.format,
          soundSystem: screen.soundSystem,
        },
      },
      tierPricing: showtime.tierPricing,
      stats: {
        totalSeats,
        bookedCount,
        heldCount,
        availableCount,
        occupancyRate,
        computedStatus,
      },
      occupiedSeatIds: Array.from(bookedSeatIds),
      heldSeatIds: Array.from(heldSeatIds),
      rows: layoutRows,
      seats: seatsWithLiveStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const createShowtime = async (req, res, next) => {
  try {
    const {
      movie,
      theatre,
      screen,
      startTime,
      endTime,
      format,
      language,
      tierPricing,
      bookedSeats,
      status,
      cancellationAvailable,
      allowPast,
    } = req.body;

    if (!movie || !theatre || !screen || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Movie, theatre, screen, and startTime are required fields',
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(movie) ||
      !mongoose.Types.ObjectId.isValid(theatre) ||
      !mongoose.Types.ObjectId.isValid(screen)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie, theatre, or screen ID format',
      });
    }

    const [foundMovie, foundTheatre, foundScreen] = await Promise.all([
      Movie.findById(movie),
      Theatre.findById(theatre),
      Screen.findById(screen),
    ]);

    if (!foundMovie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    if (!foundTheatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found' });
    }
    if (!foundScreen) {
      return res.status(404).json({ success: false, message: 'Screen not found' });
    }

    if (foundScreen.theatre.toString() !== foundTheatre._id.toString()) {
      return res.status(400).json({
        success: false,
        message: `Screen '${foundScreen.name}' does not belong to Theatre '${foundTheatre.name}'`,
      });
    }

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime date format',
      });
    }

    if (!allowPast && startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule a showtime in the past',
      });
    }

    let endDate;
    if (endTime) {
      endDate = new Date(endTime);
      if (isNaN(endDate.getTime()) || endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'endTime must be a valid date strictly after startTime',
        });
      }
    } else {

      const durationMinutes = foundMovie.durationMinutes || 120;
      endDate = new Date(startDate.getTime() + (durationMinutes + 20) * 60000);
    }

    const conflict = await Showtime.findConflict(screen, startDate, endDate);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message:
          'Screen schedule conflict: An overlapping showtime already exists on this screen during the requested time window.',
        conflict: {
          conflictingShowtimeId: conflict._id,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        },
      });
    }

    const showtime = await Showtime.create({
      movie: foundMovie._id,
      theatre: foundTheatre._id,
      screen: foundScreen._id,
      startTime: startDate,
      endTime: endDate,
      format: format || foundScreen.format || '2D',
      language: language || (foundMovie.languages?.[0] || 'Hindi'),
      tierPricing: tierPricing || {
        'VIP Recliner': 520,
        'Premium': 380,
        'Classic': 280,
      },
      bookedSeats: bookedSeats || [],
      status: status || 'available',
      cancellationAvailable:
        cancellationAvailable !== undefined
          ? cancellationAvailable
          : foundTheatre.cancellationAvailable,
    });

    res.status(201).json({
      success: true,
      message: 'Showtime scheduled successfully',
      showtime,
    });
  } catch (error) {
    next(error);
  }
};

export const updateShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Showtime ID format',
      });
    }

    const showtime = await Showtime.findById(id);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    const {
      startTime,
      endTime,
      screen,
      tierPricing,
      format,
      language,
      status,
      cancellationAvailable,
      isActive,
    } = req.body;

    const targetScreen = screen ? screen : showtime.screen;
    const targetStart = startTime ? new Date(startTime) : showtime.startTime;
    const targetEnd = endTime ? new Date(endTime) : showtime.endTime;

    if (targetEnd <= targetStart) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be strictly after startTime',
      });
    }

    if (startTime || endTime || screen) {
      const conflict = await Showtime.findConflict(
        targetScreen,
        targetStart,
        targetEnd,
        showtime._id
      );
      if (conflict) {
        return res.status(409).json({
          success: false,
          message:
            'Screen schedule conflict: An overlapping showtime already exists on this screen during the requested time window.',
          conflict: {
            conflictingShowtimeId: conflict._id,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
          },
        });
      }
    }

    if (screen) showtime.screen = screen;
    if (startTime) showtime.startTime = targetStart;
    if (endTime) showtime.endTime = targetEnd;
    if (format) showtime.format = format;
    if (language) showtime.language = language;
    if (status) showtime.status = status;
    if (cancellationAvailable !== undefined) showtime.cancellationAvailable = cancellationAvailable;
    if (isActive !== undefined) showtime.isActive = isActive;
    if (tierPricing) showtime.tierPricing = tierPricing;

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

export const deleteShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Showtime ID format',
      });
    }

    const showtime = await Showtime.findById(id);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    if (showtime.bookedSeats && showtime.bookedSeats.length > 0) {
      showtime.status = 'cancelled';
      showtime.isActive = false;
      await showtime.save();

      return res.status(200).json({
        success: true,
        message:
          'Showtime has existing seat bookings. Showtime status has been marked as cancelled.',
      });
    }

    await Showtime.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Showtime deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
