import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import Screen from '../models/Screen.js';

export const getTheatres = async (req, res, next) => {
  try {
    const { city, search, partnerTier, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };

    if (city && city.toLowerCase() !== 'all') {
      filter.city = city.toLowerCase().trim();
    }

    if (partnerTier) {
      filter.partnerTier = partnerTier;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { address: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [theatres, total] = await Promise.all([
      Theatre.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('screens', 'screenNumber name format totalSeats isActive'),
      Theatre.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: theatres.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      theatres,
    });
  } catch (error) {
    next(error);
  }
};

export const getTheatreById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let theatre;
    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findById(id).populate('screens');
    } else {
      theatre = await Theatre.findOne({ slug: id.toLowerCase().trim() }).populate('screens');
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: `Theatre not found with identifier: '${id}'`,
      });
    }

    res.status(200).json({
      success: true,
      theatre,
    });
  } catch (error) {
    next(error);
  }
};

export const getTheatreScreens = async (req, res, next) => {
  try {
    const { id } = req.params;

    let theatre;
    if (mongoose.Types.ObjectId.isValid(id)) {
      theatre = await Theatre.findById(id);
    } else {
      theatre = await Theatre.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: `Theatre not found with identifier: '${id}'`,
      });
    }

    const screens = await Screen.find({ theatre: theatre._id, isActive: true })
      .sort({ screenNumber: 1 })
      .select('-seats'); 

    res.status(200).json({
      success: true,
      theatre: {
        id: theatre._id,
        name: theatre.name,
        slug: theatre.slug,
        city: theatre.city,
      },
      count: screens.length,
      screens,
    });
  } catch (error) {
    next(error);
  }
};

export const createTheatre = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      location,
      city,
      state,
      address,
      distance,
      amenities,
      cancellationAvailable,
      contactPhone,
      partnerTier,
      isActive,
    } = req.body;

    if (!name || !location || !city) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, and city are required fields',
      });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingSlug = await Theatre.findOne({ slug: generatedSlug });
    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: `A theatre with slug '${generatedSlug}' already exists. Please provide a unique name or slug.`,
      });
    }

    const theatre = await Theatre.create({
      name,
      slug: generatedSlug,
      location,
      city: city.toLowerCase().trim(),
      state,
      address,
      distance,
      amenities,
      cancellationAvailable,
      contactPhone,
      partnerTier,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Theatre created successfully',
      theatre,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    const allowedUpdates = [
      'name',
      'slug',
      'location',
      'city',
      'state',
      'address',
      'distance',
      'amenities',
      'cancellationAvailable',
      'contactPhone',
      'partnerTier',
      'isActive',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        theatre[field] = req.body[field];
      }
    });

    if (req.body.city) {
      theatre.city = req.body.city.toLowerCase().trim();
    }

    await theatre.save();

    res.status(200).json({
      success: true,
      message: 'Theatre updated successfully',
      theatre,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTheatre = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    theatre.isActive = false;
    await theatre.save();

    res.status(200).json({
      success: true,
      message: `Theatre '${theatre.name}' deactivated successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const createScreen = async (req, res, next) => {
  try {
    const { id } = req.params;

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

    const { screenNumber, name, format, soundSystem, seats } = req.body;

    if (!screenNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'screenNumber and name are required',
      });
    }

    const existingScreen = await Screen.findOne({ theatre: theatre._id, screenNumber });
    if (existingScreen) {
      return res.status(409).json({
        success: false,
        message: `Screen number ${screenNumber} already exists in ${theatre.name}`,
      });
    }

    const screen = await Screen.create({
      theatre: theatre._id,
      screenNumber,
      name,
      format: format || '2D',
      soundSystem: soundSystem || 'Dolby Atmos',
      seats: seats && seats.length > 0 ? seats : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Screen created successfully',
      screen,
    });
  } catch (error) {
    next(error);
  }
};

export const updateScreen = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Screen ID format',
      });
    }

    const screen = await Screen.findById(id);
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    const allowed = ['name', 'format', 'soundSystem', 'isActive', 'screenNumber'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        screen[field] = req.body[field];
      }
    });

    if (req.body.seats && Array.isArray(req.body.seats)) {
      screen.seats = req.body.seats;
      screen.totalSeats = req.body.seats.length;
    }

    await screen.save();

    res.status(200).json({
      success: true,
      message: 'Screen updated successfully',
      screen,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteScreen = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Screen ID format',
      });
    }

    const screen = await Screen.findById(id);
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found',
      });
    }

    screen.isActive = false;
    await screen.save();

    res.status(200).json({
      success: true,
      message: `Screen '${screen.name}' deactivated successfully`,
    });
  } catch (error) {
    next(error);
  }
};
