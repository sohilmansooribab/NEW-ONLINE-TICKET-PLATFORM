import mongoose from 'mongoose';
import Movie from '../models/Movie.js';

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMovies = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      genre,
      language,
      industry,
      category,
      tag,
      status,
      format,
      director,
      minRating,
      sort,
      search,
    } = req.query;

    const query = {};

    const isAdmin = req.user && req.user.role === 'ADMIN';
    if (!isAdmin) {
      query.isPublished = true;
    } else if (status) {
      query.status = status.toLowerCase();
    }

    if (genre && genre !== 'all') {
      query.genres = { $regex: new RegExp(`^${escapeRegex(genre)}$`, 'i') };
    }

    if (language && language !== 'All Languages') {
      query.languages = { $regex: new RegExp(`^${escapeRegex(language)}$`, 'i') };
    }

    const targetIndustry = industry || category;
    if (targetIndustry && targetIndustry !== 'all') {
      query.industry = targetIndustry.toLowerCase();
    }

    if (tag && tag !== 'all') {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    if (format && format !== 'All Formats') {
      query.formats = { $regex: new RegExp(escapeRegex(format), 'i') };
    }

    if (director) {
      query.director = { $regex: new RegExp(escapeRegex(director), 'i') };
    }

    if (minRating) {
      const parsedRating = parseFloat(minRating);
      if (!isNaN(parsedRating)) {
        query.rating = { $gte: parsedRating };
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { director: searchRegex },
        { 'cast.name': searchRegex },
      ];
    }

    let sortOptions = { isHeroFeatured: -1, releaseDate: -1, _id: -1 };
    if (sort) {
      if (sort === 'rating' || sort === '-rating') {
        sortOptions = { rating: -1, voteCount: -1 };
      } else if (sort === 'rating_asc' || sort === 'rating:asc') {
        sortOptions = { rating: 1 };
      } else if (sort === 'release' || sort === 'releaseDate' || sort === '-releaseDate') {
        sortOptions = { releaseDate: -1 };
      } else if (sort === 'release_asc' || sort === 'releaseDate:asc') {
        sortOptions = { releaseDate: 1 };
      } else if (sort === 'title' || sort === 'title:asc') {
        sortOptions = { title: 1 };
      } else if (sort === '-title' || sort === 'title:desc') {
        sortOptions = { title: -1 };
      } else if (sort === 'popularity') {
        sortOptions = { isHeroFeatured: -1, rating: -1 };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Movie.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedMovies = async (req, res, next) => {
  try {
    const featured = await Movie.find({
      isPublished: true,
      isHeroFeatured: true,
    })
      .sort({ rating: -1, releaseDate: -1 })
      .limit(6);

    let movies = featured;
    if (movies.length === 0) {
      movies = await Movie.find({ isPublished: true })
        .sort({ rating: -1 })
        .limit(5);
    }

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

export const searchMovies = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10, industry } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search term using the query parameter "q" (e.g. ?q=dune)',
      });
    }

    const trimmed = q.trim();
    const searchRegex = new RegExp(escapeRegex(trimmed), 'i');

    const query = {
      isPublished: true,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { director: searchRegex },
        { 'cast.name': searchRegex },
      ],
    };

    if (industry && industry !== 'all') {
      query.industry = industry.toLowerCase();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ rating: -1 }).skip(skip).limit(limitNum),
      Movie.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      query: trimmed,
      count: movies.length,
      total,
      page: pageNum,
      totalPages,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

export const getMovieByIdOrSlug = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie ID or slug parameter',
      });
    }

    const trimmedId = id.trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(trimmedId);

    let movie = null;
    if (isObjectId) {
      movie = await Movie.findById(trimmedId);
    }

    if (!movie) {
      movie = await Movie.findOne({ slug: trimmedId.toLowerCase() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier: '${trimmedId}'`,
      });
    }

    const isAdmin = req.user && req.user.role === 'ADMIN';
    if (!movie.isPublished && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier: '${trimmedId}'`,
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      description,
      synopsis,
      poster,
      backdrop,
      genres,
      languages,
      releaseDate,
      duration,
      durationMinutes,
      director,
      certification,
      trailerUrl,
      rating,
      voteCount,
      formats,
      industry,
      isHeroFeatured,
      heroTag,
      priceStartingAt,
      tags,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie title is required',
      });
    }

    const movieDescription = description || synopsis;
    if (!movieDescription || !movieDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie description / synopsis is required',
      });
    }

    if (!poster || !poster.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Movie poster image URL is required',
      });
    }

    if (!genres || (Array.isArray(genres) && genres.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one genre is required',
      });
    }

    if (!languages || (Array.isArray(languages) && languages.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one language is required',
      });
    }

    if (!releaseDate) {
      return res.status(400).json({
        success: false,
        message: 'Release date is required',
      });
    }

    if (!director || !director.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Director name is required',
      });
    }

    const computedSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await Movie.findOne({ slug: computedSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A movie with slug '${computedSlug}' already exists. Please provide a unique slug or title.`,
      });
    }

    const movie = await Movie.create({
      title: title.trim(),
      slug: computedSlug,
      description: movieDescription.trim(),
      poster: poster.trim(),
      backdrop: backdrop ? backdrop.trim() : '',
      genres: Array.isArray(genres) ? genres : [genres],
      languages: Array.isArray(languages) ? languages : [languages],
      releaseDate: new Date(releaseDate),
      duration: duration || '2h 15m',
      durationMinutes: durationMinutes || 135,
      director: director.trim(),
      certification: certification || 'U/A',
      trailerUrl: trailerUrl || '',
      rating: rating !== undefined ? Number(rating) : 8.0,
      voteCount: voteCount || '1K+',
      formats: formats || ['2D', 'IMAX Laser'],
      industry: industry || 'bollywood',
      isHeroFeatured: Boolean(isHeroFeatured),
      heroTag: heroTag || '',
      priceStartingAt: priceStartingAt ? Number(priceStartingAt) : 250,
      tags: tags || ['trending'],
      status: status || 'published',
      isPublished: status !== 'draft',
      cast: req.body.cast || [],
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully in catalogue',
      data: movie,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A movie with this slug or title already exists in the database',
      });
    }
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    let movie = null;
    if (isObjectId) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id.toLowerCase() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier: '${id}'`,
      });
    }

    if (req.body.title && !req.body.slug && req.body.title !== movie.title) {
      req.body.slug = req.body.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    if (req.body.status) {
      req.body.isPublished = req.body.status === 'published';
    }

    if (req.body.synopsis && !req.body.description) {
      req.body.description = req.body.synopsis;
    }

    const updated = await Movie.findByIdAndUpdate(movie._id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A movie with this slug already exists',
      });
    }
    next(error);
  }
};

export const togglePublishMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    let movie = null;
    if (isObjectId) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id.toLowerCase() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier: '${id}'`,
      });
    }

    const requestedStatus = req.body.status;
    if (requestedStatus && ['published', 'draft', 'archived'].includes(requestedStatus)) {
      movie.status = requestedStatus;
    } else {
      movie.status = movie.status === 'published' ? 'draft' : 'published';
    }

    movie.isPublished = movie.status === 'published';
    await movie.save();

    res.status(200).json({
      success: true,
      message: `Movie publication status updated to '${movie.status}'`,
      data: {
        id: movie._id,
        slug: movie.slug,
        title: movie.title,
        status: movie.status,
        isPublished: movie.isPublished,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    let movie = null;
    if (isObjectId) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id.toLowerCase() });
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: `Movie not found with identifier: '${id}'`,
      });
    }

    await Movie.findByIdAndDelete(movie._id);

    res.status(200).json({
      success: true,
      message: `Movie '${movie.title}' deleted successfully from catalogue`,
      deletedId: movie._id,
      deletedSlug: movie.slug,
    });
  } catch (error) {
    next(error);
  }
};
