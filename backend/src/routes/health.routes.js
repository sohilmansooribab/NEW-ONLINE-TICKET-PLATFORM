import { Router } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {

  if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (_) {

    }
  }

  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const rawUri = process.env.MONGODB_URI || '';
  const hasMongoURI = !!rawUri.trim();
  const isPlaceholder = rawUri.includes('<db_password>') || rawUri.includes('<password>');

  res.status(200).json({
    success: true,
    status: dbState === 1 ? 'OK' : 'DEGRADED',
    message: dbState === 1 ? 'CineBook Backend API and Database are operational' : 'CineBook Backend API is operational but Database is disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      hasMongoURI,
      isPlaceholder,
      host: mongoose.connection.host || null,
    },
  });
});

export default router;
