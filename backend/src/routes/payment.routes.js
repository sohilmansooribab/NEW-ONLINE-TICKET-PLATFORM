import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authenticated customer payment workflow
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);

// Payment provider webhook listener (raw request body signature verified)
router.post('/webhook', handleWebhook);

export default router;
