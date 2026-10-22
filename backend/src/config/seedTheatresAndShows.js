import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import Screen from '../models/Screen.js';
import Showtime from '../models/Showtime.js';
import Movie from '../models/Movie.js';

export const SAMPLE_THEATRES = [
  {
    name: "PVR Director's Cut",
    slug: 'pvr-directors-cut',
    location: 'Ambience Mall, Vasant Kunj, New Delhi',
    city: 'delhi',
    distance: '3.4 km away',
    amenities: ['Dolby Atmos', '4K Laser', 'Luxury Recliners', 'Gourmet In-Seat Dining'],
    cancellationAvailable: true,
    partnerTier: 'Diamond',
    screens: [
      {
        screenNumber: 1,
        name: 'Screen 1 — IMAX Laser',
        format: 'IMAX Laser',
        soundSystem: 'Dolby Atmos',
      },
      {
        screenNumber: 2,
        name: 'Screen 2 — Dolby Atmos Luxury',
        format: '2D',
        soundSystem: 'Dolby Atmos',
      },
    ],
  },
  {
    name: 'PVR INOX Megaplex',
    slug: 'pvr-inox-megaplex',
    location: 'Eros Corporate Tower, Nehru Place, New Delhi',
    city: 'delhi',
    distance: '5.8 km away',
    amenities: ['IMAX Laser', '4DX Motion', 'Dolby 7.1', 'Valet Parking'],
    cancellationAvailable: true,
    partnerTier: 'Platinum',
    screens: [
      {
        screenNumber: 1,
        name: 'Audi 3 — IMAX Laser',
        format: 'IMAX 3D',
        soundSystem: 'Dolby Atmos',
      },
      {
        screenNumber: 2,
        name: 'Audi 5 — 4DX Motion Theatre',
        format: '4DX',
        soundSystem: 'Dolby 7.1',
      },
    ],
  },
  {
    name: 'Cinépolis VIP',
    slug: 'cinepolis-vip',
    location: 'DLF Avenue Mall, Saket, New Delhi',
    city: 'delhi',
    distance: '7.1 km away',
    amenities: ['Macro XE', 'RealD 3D', 'VIP Butler Service', 'Recliner Loungers'],
    cancellationAvailable: false,
    partnerTier: 'Platinum',
    screens: [
      {
        screenNumber: 1,
        name: 'Screen 4 — Macro XE',
        format: 'Macro XE',
        soundSystem: 'Dolby Atmos',
      },
    ],
  },
  {
    name: 'Miraj Cinemas Superdome',
    slug: 'miraj-cinemas-superdome',
    location: 'Subhash Nagar Metro Station, New Delhi',
    city: 'delhi',
    distance: '9.2 km away',
    amenities: ['Dolby Atmos', 'RGB Laser Projection', 'Café Lounge'],
    cancellationAvailable: true,
    partnerTier: 'Gold',
    screens: [
      {
        screenNumber: 1,
        name: 'Audi 1 — Laser 4K',
        format: '2D',
        soundSystem: 'Dolby Atmos',
      },
    ],
  },
];

// Predefined sample occupied seats matching frontend demo
const DEMO_BOOKED_SEATS = [
  { seatId: 'A5' },
  { seatId: 'A6' },
  { seatId: 'C7' },
  { seatId: 'C8' },
  { seatId: 'D4' },
  { seatId: 'D5' },
  { seatId: 'D6' },
  { seatId: 'F9' },
  { seatId: 'F10' },
  { seatId: 'H3' },
  { seatId: 'H4' },
  { seatId: 'J11' },
  { seatId: 'J12' },
];

export const seedTheatresAndShows = async () => {
  try {
    console.log('[Seed] Synchronizing theatres and screens...');

    const savedScreens = [];
    const savedTheatres = [];

    for (const tData of SAMPLE_THEATRES) {
      const { screens, ...theatreFields } = tData;

      let theatre = await Theatre.findOneAndUpdate(
        { slug: theatreFields.slug },
        theatreFields,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      savedTheatres.push(theatre);

      // Seed screens for this theatre
      for (const scData of screens) {
        let screen = await Screen.findOne({
          theatre: theatre._id,
          screenNumber: scData.screenNumber,
        });

        if (!screen) {
          screen = await Screen.create({
            theatre: theatre._id,
            screenNumber: scData.screenNumber,
            name: scData.name,
            format: scData.format,
            soundSystem: scData.soundSystem,
          });
        } else {
          screen.name = scData.name;
          screen.format = scData.format;
          screen.soundSystem = scData.soundSystem;
          await screen.save();
        }

        savedScreens.push({ theatre, screen });
      }
    }

    console.log(`[Seed] Theatres & screens synchronized (${savedTheatres.length} theatres, ${savedScreens.length} screens).`);

    // Fetch movies to link to future showtimes
    const movies = await Movie.find({ isPublished: true }).limit(6);
    if (movies.length === 0) {
      console.warn('[Seed] No movies found in database. Please run movie seeder first.');
      return true;
    }

    console.log(`[Seed] Generating future showtimes for ${movies.length} movies across ${savedScreens.length} screens...`);

    // Time schedule slots: [Hour, Minute] in 24-hr format
    const timeSlots = [
      { hours: 10, minutes: 30, tierPricing: { 'VIP Recliner': 520, 'Premium': 380, 'Classic': 280 } },
      { hours: 14, minutes: 0,  tierPricing: { 'VIP Recliner': 550, 'Premium': 400, 'Classic': 300 } },
      { hours: 18, minutes: 15, tierPricing: { 'VIP Recliner': 650, 'Premium': 450, 'Classic': 350 } },
      { hours: 21, minutes: 45, tierPricing: { 'VIP Recliner': 590, 'Premium': 420, 'Classic': 320 } },
    ];

    let createdShowsCount = 0;
    const now = new Date();

    // Schedule shows for today + next 4 days (5 days total)
    for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
      const showDay = new Date(now);
      showDay.setDate(now.getDate() + dayOffset);

      for (let sIdx = 0; sIdx < savedScreens.length; sIdx++) {
        const { theatre, screen } = savedScreens[sIdx];
        const assignedMovie = movies[(sIdx + dayOffset) % movies.length];

        for (const slot of timeSlots) {
          const startTime = new Date(showDay);
          startTime.setHours(slot.hours, slot.minutes, 0, 0);

          // If this slot is in the past for today, advance it to tomorrow so it is future
          if (startTime <= now) {
            continue;
          }

          const durationMinutes = assignedMovie.durationMinutes || 135;
          const endTime = new Date(startTime.getTime() + (durationMinutes + 20) * 60000);

          // Check if showtime already exists
          const existing = await Showtime.findOne({
            screen: screen._id,
            startTime,
          });

          if (!existing) {
            await Showtime.create({
              movie: assignedMovie._id,
              theatre: theatre._id,
              screen: screen._id,
              startTime,
              endTime,
              format: screen.format || '2D',
              language: assignedMovie.languages?.[0] || 'Hindi',
              tierPricing: slot.tierPricing,
              bookedSeats: (slot.hours === 18 || slot.hours === 21) ? DEMO_BOOKED_SEATS : [],
              status: (slot.hours === 18) ? 'fast-filling' : 'available',
              cancellationAvailable: theatre.cancellationAvailable,
            });
            createdShowsCount++;
          }
        }
      }
    }

    const totalShowtimes = await Showtime.countDocuments();
    console.log(`[Seed] Showtimes generation complete. Added ${createdShowsCount} new future showtimes. Total showtimes in DB: ${totalShowtimes}`);
    return true;
  } catch (error) {
    console.error(`[Seed] Error seeding theatres and showtimes: ${error.message}`);
    return false;
  }
};

/**
 * Checks if theatres and showtimes collection is empty.
 * Never touches users or bookings.
 */
export const seedTheatresAndShowsIfEmpty = async () => {
  try {
    const theatreCount = await Theatre.countDocuments();
    const showtimeCount = await Showtime.countDocuments();

    if (theatreCount === 0 || showtimeCount === 0) {
      console.log(`[Seed] Theatres or showtimes missing in DB (${theatreCount} theatres, ${showtimeCount} shows). Populating demo venues & schedule...`);
      await seedTheatresAndShows();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[Seed] Error checking theatre/showtime seeding: ${error.message}`);
    return false;
  }
};

// Standalone execution: node src/config/seedTheatresAndShows.js
if (process.argv[1] && process.argv[1].endsWith('seedTheatresAndShows.js')) {
  (async () => {
    try {
      let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
      if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
        mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
      }
      await mongoose.connect(mongoURI);
      console.log('Connected to MongoDB for standalone theatre/showtime seeding.');

      await seedTheatresAndShows();

      await mongoose.disconnect();
      console.log('Finished seeding theatres and showtimes.');
      process.exit(0);
    } catch (err) {
      console.error('Seed execution failed:', err);
      process.exit(1);
    }
  })();
}
