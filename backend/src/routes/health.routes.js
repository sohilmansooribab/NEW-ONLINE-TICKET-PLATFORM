import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint to inspect server and database status
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'CineBook Backend API is operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatusMap[dbState] || 'unknown',
    },
  });
});

export default router;
