import { Router } from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Public Authentication Endpoints
router.post('/signup', signup);
router.post('/login', login);

// Protected Authentication Verification Endpoint
router.get('/me', protect, getMe);

export default router;
