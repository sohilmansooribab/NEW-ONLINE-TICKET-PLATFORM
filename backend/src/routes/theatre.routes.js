import express from 'express';
import {
  getTheatres,
  getTheatreById,
  getTheatreScreens,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  createScreen,
  updateScreen,
  deleteScreen,
} from '../controllers/theatreController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getTheatres);
router.get('/:id', getTheatreById);
router.get('/:id/screens', getTheatreScreens);

// Admin-only Theatre CRUD
router.post('/', protect, authorize('ADMIN'), createTheatre);
router.put('/:id', protect, authorize('ADMIN'), updateTheatre);
router.delete('/:id', protect, authorize('ADMIN'), deleteTheatre);

// Admin-only Screen CRUD
router.post('/:id/screens', protect, authorize('ADMIN'), createScreen);
router.put('/screens/:id', protect, authorize('ADMIN'), updateScreen);
router.delete('/screens/:id', protect, authorize('ADMIN'), deleteScreen);

export default router;
