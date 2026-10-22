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

// Enforce authentication & ORGANIZER / ADMIN role authorization
router.use(protect, authorize('ORGANIZER', 'ADMIN'));

// Profile and Assigned Multiplex Venues
router.get('/profile', getOrganizerProfile);
router.get('/theatres', getOrganizerTheatres);

// Showtimes strictly on organizer-managed theatres
router.get('/showtimes', getOrganizerShowtimes);
router.post('/showtimes', createOrganizerShowtime);
router.put('/showtimes/:id', updateOrganizerShowtime);
router.delete('/showtimes/:id', deleteOrganizerShowtime);

// Bookings and Analytics strictly for organizer-managed theatres
router.get('/bookings', getOrganizerBookings);
router.get('/analytics', getOrganizerAnalytics);

export default router;
