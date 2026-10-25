import mongoose from 'mongoose';

let isConnecting = false;

export let lastConnectionError = null;

export const connectDB = async () => {

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (mongoose.connection.readyState === 2 || isConnecting) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const checkInterval = setInterval(() => {
        elapsed += 100;
        if (mongoose.connection.readyState === 1) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (!isConnecting && mongoose.connection.readyState === 0) {
          clearInterval(checkInterval);
          resolve(false);
        } else if (elapsed >= 12000) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  try {
    isConnecting = true;
    lastConnectionError = null;
    let mongoURI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook').trim();

    if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
      console.warn('[Database] Notice: MONGODB_URI contains placeholder <db_password>. Using local MongoDB (mongodb://127.0.0.1:27017/cinebook) until real Atlas credentials are provided.');
      mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, 
      socketTimeoutMS: 45000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    lastConnectionError = error.message;
    console.warn(`[Database] Connection Warning: ${error.message}`);
    return false;
  } finally {
    isConnecting = false;
  }
};
