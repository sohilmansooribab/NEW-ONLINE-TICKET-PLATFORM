import express from 'express';
import {
  getShowtimes,
  getShowtimeById,
  getShowtimeSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from '../controllers/showtimeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getShowtimes);
router.get('/:id', getShowtimeById);
router.get('/:id/seats', getShowtimeSeats);

// Admin-protected routes
router.post('/', protect, authorize('ADMIN'), createShowtime);
router.put('/:id', protect, authorize('ADMIN'), updateShowtime);
router.delete('/:id', protect, authorize('ADMIN'), deleteShowtime);

export default router;
