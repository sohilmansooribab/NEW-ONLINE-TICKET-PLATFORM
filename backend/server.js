import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedMoviesIfEmpty } from './src/config/seedMovies.js';
import { seedTheatresAndShowsIfEmpty } from './src/config/seedTheatresAndShows.js';

const PORT = process.env.PORT || 5000;

// Initialize Database Connection and Auto-seed initial catalogue if empty
connectDB().then(async (connected) => {
  if (connected) {
    await seedMoviesIfEmpty();
    await seedTheatresAndShowsIfEmpty();
  }
});

// Start Server Listener
const server = app.listen(PORT, () => {
  console.log(`🚀 CineBook Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check Endpoint: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

export default server;
