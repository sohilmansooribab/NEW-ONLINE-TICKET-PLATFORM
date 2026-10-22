import { Router } from 'express';
import {
  getMovies,
  getFeaturedMovies,
  searchMovies,
  getMovieByIdOrSlug,
  createMovie,
  updateMovie,
  togglePublishMovie,
  deleteMovie,
} from '../controllers/movieController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// --- PUBLIC DISCOVERY ENDPOINTS ---
// 1. Paginated, filtered, sorted movies catalogue
router.get('/', getMovies);

// 2. Featured Spotlight / Hero movies
router.get('/featured', getFeaturedMovies);

// 3. Search movies by keyword
router.get('/search', searchMovies);

// 4. Single movie details by MongoDB ID or slug
router.get('/:id', getMovieByIdOrSlug);

// --- ADMIN PROTECTED MANAGEMENT ENDPOINTS ---
// Only authenticated users with ADMIN role can create, update, publish, or delete movies
router.post('/', protect, authorize('ADMIN'), createMovie);
router.put('/:id', protect, authorize('ADMIN'), updateMovie);
router.patch('/:id/publish', protect, authorize('ADMIN'), togglePublishMovie);
router.delete('/:id', protect, authorize('ADMIN'), deleteMovie);

export default router;
