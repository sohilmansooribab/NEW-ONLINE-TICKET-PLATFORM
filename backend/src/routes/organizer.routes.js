import express from 'express';
import {
  getOrganizerProfile,
  getOrganizerTheatres,
  getOrganizerShowtimes,
  createOrganizerShowtime,
  updateOrganizerShowtime,
  deleteOrganizerShowtime,
  getOrganizerBookings,
  getOrganizerAnalytics,
} from '../controllers/organizerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('ORGANIZER', 'ADMIN'));

router.get('/profile', getOrganizerProfile);
router.get('/theatres', getOrganizerTheatres);

router.get('/showtimes', getOrganizerShowtimes);
router.post('/showtimes', createOrganizerShowtime);
router.put('/showtimes/:id', updateOrganizerShowtime);
router.delete('/showtimes/:id', deleteOrganizerShowtime);

router.get('/bookings', getOrganizerBookings);
router.get('/analytics', getOrganizerAnalytics);

export default router;
