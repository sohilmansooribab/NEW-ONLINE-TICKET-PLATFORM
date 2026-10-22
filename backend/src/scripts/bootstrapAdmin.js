import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Secure Admin Bootstrap CLI Script
 * Promotes an existing registered user to the ADMIN role.
 * Usage: node src/scripts/bootstrapAdmin.js <email>
 */
const bootstrapAdmin = async () => {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    console.error('❌ Error: Target user email must be provided as an argument.');
    console.log('Usage: node src/scripts/bootstrapAdmin.js <user-email>');
    process.exit(1);
  }

  const normalizedEmail = targetEmail.trim().toLowerCase();

  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
  if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
    mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('[Bootstrap] Connected to MongoDB.');

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.error(
        `❌ Error: User account with email '${normalizedEmail}' does not exist in the database.`
      );
      console.log('Please register the account first via POST /api/auth/signup, then run this bootstrap script.');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`ℹ️ User '${normalizedEmail}' is already configured with the 'ADMIN' role.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const previousRole = user.role;
    user.role = 'ADMIN';
    await user.save();

    console.log(`✅ Success: User '${user.name}' (${normalizedEmail}) has been promoted from '${previousRole}' to 'ADMIN'.`);
    console.log(`User ID: ${user._id}`);
    console.log('You may now log in with this account to access all administrative features.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal bootstrap error:', err.message);
    process.exit(1);
  }
};

bootstrapAdmin();
