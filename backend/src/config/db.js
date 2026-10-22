import mongoose from 'mongoose';

/**
 * Connect to MongoDB database via Mongoose
 * Gracefully detects unpopulated placeholder URIs and falls back to local MongoDB
 * so the API server runs seamlessly during development.
 */
export const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';

    // If Atlas connection string contains the unpopulated <db_password> placeholder, fallback to local MongoDB
    if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
      console.warn('[Database] Notice: MONGODB_URI contains placeholder <db_password>. Using local MongoDB (mongodb://127.0.0.1:27017/cinebook) until real Atlas credentials are provided.');
      mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database] Connection Warning: ${error.message}`);
    console.warn('[Database] Running in standalone mode. Connect MongoDB to enable persistent database storage.');
    return false;
  }
};
