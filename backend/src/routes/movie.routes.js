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

router.get('/', getMovies);

router.get('/featured', getFeaturedMovies);

router.get('/search', searchMovies);

router.get('/:id', getMovieByIdOrSlug);

router.post('/', protect, authorize('ADMIN'), createMovie);
router.put('/:id', protect, authorize('ADMIN'), updateMovie);
router.patch('/:id/publish', protect, authorize('ADMIN'), togglePublishMovie);
router.delete('/:id', protect, authorize('ADMIN'), deleteMovie);

export default router;
