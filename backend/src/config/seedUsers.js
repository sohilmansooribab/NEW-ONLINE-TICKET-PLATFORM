import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Theatre from '../models/Theatre.js';

export const seedDemoUsers = async () => {
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
  if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
    mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
  }

  const shouldDisconnect = mongoose.connection.readyState === 0;
  if (shouldDisconnect) {
    await mongoose.connect(mongoURI);
  }

  console.log('[User Seeder] Checking demo accounts...');

  const demoAccounts = [
    {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      password: 'password123',
      role: 'USER',
    },
    {
      name: 'PVR Multiplex Organizer',
      email: 'organizer@pvrcinemas.com',
      password: 'password123',
      role: 'ORGANIZER',
    },
    {
      name: 'System Administrator',
      email: 'admin@cinebook.com',
      password: 'password123',
      role: 'ADMIN',
    },
  ];

  for (const acc of demoAccounts) {
    let existing = await User.findOne({ email: acc.email });
    if (!existing) {
      const passwordHash = await User.hashPassword(acc.password);
      existing = await User.create({
        name: acc.name,
        email: acc.email,
        passwordHash,
        role: acc.role,
      });
      console.log(`[User Seeder] Created account: ${acc.email} (${acc.role})`);
    } else {
      if (existing.role !== acc.role) {
        existing.role = acc.role;
        await existing.save();
        console.log(`[User Seeder] Updated role for ${acc.email} to ${acc.role}`);
      }
    }

    // If organizer, assign to first theatre if unassigned
    if (acc.role === 'ORGANIZER') {
      const theatre = await Theatre.findOne();
      if (theatre && !theatre.organizer) {
        theatre.organizer = existing._id;
        await theatre.save();
        console.log(`[User Seeder] Assigned theatre '${theatre.name}' to organizer ${acc.email}`);
      }
    }
  }

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }
};

// If run directly via CLI
if (process.argv[1]?.endsWith('seedUsers.js')) {
  seedDemoUsers()
    .then(() => {
      console.log('[User Seeder] Completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[User Seeder] Error:', err);
      process.exit(1);
    });
}
