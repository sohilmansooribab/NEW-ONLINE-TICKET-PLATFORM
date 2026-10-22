import express from 'express';
import {
  getAdminUsers,
  getAdminUserById,
  updateUserRole,
  deleteUser,
  assignTheatreOrganizer,
  getAdminBookings,
  getAdminAnalytics,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication & ADMIN role authorization on all admin routes
router.use(protect, authorize('ADMIN'));

// User and Organizer Management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Theatre Organizer Assignment
router.put('/theatres/:id/assign-organizer', assignTheatreOrganizer);
router.patch('/theatres/:id/assign-organizer', assignTheatreOrganizer);

// Booking Inspection & Oversight
router.get('/bookings', getAdminBookings);

// Platform Analytics & Settled Revenue Metrics
router.get('/analytics', getAdminAnalytics);

export default router;
