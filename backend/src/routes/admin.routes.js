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

router.use(protect, authorize('ADMIN'));

router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id/role', updateUserRole);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.put('/theatres/:id/assign-organizer', assignTheatreOrganizer);
router.patch('/theatres/:id/assign-organizer', assignTheatreOrganizer);

router.get('/bookings', getAdminBookings);

router.get('/analytics', getAdminAnalytics);

export default router;
