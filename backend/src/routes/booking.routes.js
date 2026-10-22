import express from 'express';
import {
  holdSeats,
  releaseHold,
  createBooking,
  confirmPayment,
  getMyBookings,
  getBookingById,
  getBookingStatus,
  cancelBooking,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Seat Hold Workflow
router.post('/hold', protect, holdSeats);
router.delete('/hold/:holdId', protect, releaseHold);

// Booking Creation & History
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);

// Individual Booking Details, Status, Payment & Cancellation
router.get('/:id', protect, getBookingById);
router.get('/:id/status', protect, getBookingStatus);
router.post('/:id/confirm-payment', protect, confirmPayment);
router.post('/:id/cancel', protect, cancelBooking);

export default router;
