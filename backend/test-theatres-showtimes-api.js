import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import Movie from './src/models/Movie.js';
import Theatre from './src/models/Theatre.js';
import Screen from './src/models/Screen.js';
import Showtime from './src/models/Showtime.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'cinebook_default_secret_key_change_in_production';

async function runTests() {
  console.log('🧪 Starting CineBook Theatres, Screens & Showtimes API Automated Tests...\n');
  const results = [];

  const assertTest = (name, passed, details = '') => {
    results.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} - ${name} ${details ? '(' + details + ')' : ''}`);
  };

  let inProcessServer = null;
  try {
    const ping = await fetch(`${BASE_URL}/health`);
    if (ping.status !== 200) throw new Error('Not running');
  } catch (e) {
    const { default: app } = await import('./src/app.js');
    inProcessServer = app.listen(5000);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Connect to DB for setup
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
  if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
    mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
  }
  await mongoose.connect(mongoURI);

  // Setup test users: USER and ADMIN
  const testUserEmail = 'test_user_theatres@example.com';
  const testAdminEmail = 'test_admin_theatres@example.com';

  let testUser = await User.findOne({ email: testUserEmail });
  if (!testUser) {
    testUser = await User.create({
      name: 'Theatre Test User',
      email: testUserEmail,
      passwordHash: 'dummyhash',
      role: 'USER',
    });
  }

  let testAdmin = await User.findOne({ email: testAdminEmail });
  if (!testAdmin) {
    testAdmin = await User.create({
      name: 'Theatre Admin',
      email: testAdminEmail,
      passwordHash: 'dummyhash',
      role: 'ADMIN',
    });
  }

  const userToken = jwt.sign({ id: testUser._id, email: testUser.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: testAdmin._id, email: testAdmin.email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  // Get active movie and screen for testing
  const sampleMovie = await Movie.findOne({ isPublished: true });
  const sampleTheatre = await Theatre.findOne({ slug: 'pvr-directors-cut' });
  const sampleScreen = await Screen.findOne({ theatre: sampleTheatre._id, screenNumber: 1 });

  // --- SUITE 1: THEATRE & SCREEN DISCOVERY ---
  console.log('\n--- SUITE 1: THEATRE & SCREEN DISCOVERY ---');

  // Test 1: GET /api/theatres
  try {
    const res = await fetch(`${BASE_URL}/theatres`);
    const data = await res.json();
    assertTest(
      'GET /api/theatres - List active theatres',
      res.status === 200 && data.success === true && Array.isArray(data.theatres) && data.theatres.length >= 4,
      `Found ${data.theatres?.length} venues`
    );
  } catch (err) {
    assertTest('GET /api/theatres - List active theatres', false, err.message);
  }

  // Test 2: Filter by City
  try {
    const res = await fetch(`${BASE_URL}/theatres?city=delhi`);
    const data = await res.json();
    const allDelhi = data.theatres.every((t) => t.city === 'delhi');
    assertTest(
      'GET /api/theatres?city=delhi - Filter venues by city',
      res.status === 200 && data.theatres.length > 0 && allDelhi,
      `Found ${data.theatres?.length} venues in Delhi`
    );
  } catch (err) {
    assertTest('GET /api/theatres?city=delhi - Filter venues by city', false, err.message);
  }

  // Test 3: GET /api/theatres/:id by slug
  let theatreId = sampleTheatre._id.toString();
  try {
    const res = await fetch(`${BASE_URL}/theatres/pvr-directors-cut`);
    const data = await res.json();
    assertTest(
      'GET /api/theatres/:slug - Lookup venue by slug with populated screens',
      res.status === 200 && data.success === true && data.theatre.name === "PVR Director's Cut" && Array.isArray(data.theatre.screens),
      `Loaded ${data.theatre?.screens?.length} screens`
    );
  } catch (err) {
    assertTest('GET /api/theatres/:slug - Lookup venue by slug', false, err.message);
  }

  // Test 4: GET /api/theatres/:id/screens
  try {
    const res = await fetch(`${BASE_URL}/theatres/${theatreId}/screens`);
    const data = await res.json();
    assertTest(
      'GET /api/theatres/:id/screens - List screens of venue',
      res.status === 200 && data.success === true && Array.isArray(data.screens) && data.screens.length >= 2,
      `Found ${data.screens?.length} screens`
    );
  } catch (err) {
    assertTest('GET /api/theatres/:id/screens - List screens of venue', false, err.message);
  }

  // --- SUITE 2: SHOWTIMES & LIVE SEAT AVAILABILITY ---
  console.log('\n--- SUITE 2: SHOWTIMES & SEAT AVAILABILITY ---');

  // Test 5: GET /api/showtimes
  let sampleShowtimeId;
  try {
    const res = await fetch(`${BASE_URL}/showtimes`);
    const data = await res.json();
    if (data.showtimes && data.showtimes.length > 0) {
      sampleShowtimeId = data.showtimes[0]._id;
    }
    assertTest(
      'GET /api/showtimes - List showtimes with populated movie, theatre, and screen',
      res.status === 200 && data.success === true && data.showtimes.length > 0 && !!data.showtimes[0].movie?.title,
      `Count: ${data.showtimes?.length}`
    );
  } catch (err) {
    assertTest('GET /api/showtimes - List showtimes', false, err.message);
  }

  // Test 6: Filter showtimes by Movie
  try {
    const res = await fetch(`${BASE_URL}/showtimes?movie=${sampleMovie.slug}`);
    const data = await res.json();
    const match = data.showtimes.every((s) => s.movie?.title === sampleMovie.title);
    assertTest(
      `GET /api/showtimes?movie=${sampleMovie.slug} - Filter showtimes by movie slug`,
      res.status === 200 && data.showtimes.length > 0 && match,
      `Matches for ${sampleMovie.title}: ${data.showtimes.length}`
    );
  } catch (err) {
    assertTest('GET /api/showtimes?movie=... - Filter showtimes by movie', false, err.message);
  }

  // Test 7: GET /api/showtimes/:id/seats (Seat Availability Source of Truth)
  try {
    const res = await fetch(`${BASE_URL}/showtimes/${sampleShowtimeId}/seats`);
    const data = await res.json();
    const hasRows = Array.isArray(data.rows) && data.rows.length === 9; // A, B, C, D, E, F, G, H, J
    const hasTiers = !!data.tierPricing?.['VIP Recliner'] && !!data.tierPricing?.['Premium'] && !!data.tierPricing?.['Classic'];
    const hasStats = typeof data.stats?.totalSeats === 'number' && typeof data.stats?.availableCount === 'number';
    const hasOccupiedArray = Array.isArray(data.occupiedSeatIds);

    assertTest(
      'GET /api/showtimes/:id/seats - Live seat availability & tiered pricing layout',
      res.status === 200 && hasRows && hasTiers && hasStats && hasOccupiedArray,
      `Total: ${data.stats?.totalSeats}, Available: ${data.stats?.availableCount}, Booked: ${data.stats?.bookedCount}`
    );
  } catch (err) {
    assertTest('GET /api/showtimes/:id/seats - Live seat availability', false, err.message);
  }

  // --- SUITE 3: ACCESS CONTROL (RBAC) ---
  console.log('\n--- SUITE 3: ACCESS CONTROL (RBAC) ---');

  // Test 8: Unauthenticated create theatre rejected (401)
  try {
    const res = await fetch(`${BASE_URL}/theatres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Multiplex', location: 'Delhi', city: 'delhi' }),
    });
    assertTest(
      'POST /api/theatres - Reject unauthenticated requests with 401',
      res.status === 401,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/theatres - Reject unauthenticated', false, err.message);
  }

  // Test 9: USER role cannot create theatre (403)
  try {
    const res = await fetch(`${BASE_URL}/theatres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ name: 'User Created Multiplex', location: 'Delhi', city: 'delhi' }),
    });
    assertTest(
      'POST /api/theatres - Reject USER role with 403 Forbidden',
      res.status === 403,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/theatres - Reject USER role', false, err.message);
  }

  // Test 10: ADMIN can create theatre (201)
  let createdTheatreId;
  try {
    const res = await fetch(`${BASE_URL}/theatres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'INOX CyberHub Test Multiplex',
        location: 'DLF CyberHub, Phase 2, Gurugram',
        city: 'gurugram',
        amenities: ['IMAX Laser', 'Dolby Atmos', 'In-Seat Dining'],
      }),
    });
    const data = await res.json();
    if (data.theatre) createdTheatreId = data.theatre._id;
    assertTest(
      'POST /api/theatres - ADMIN can create new theatre venue (201)',
      res.status === 201 && data.success === true && !!createdTheatreId,
      `Created ID: ${createdTheatreId}`
    );
  } catch (err) {
    assertTest('POST /api/theatres - ADMIN can create theatre', false, err.message);
  }

  // Test 11: ADMIN can create screen under theatre (201)
  let createdScreenId;
  try {
    const res = await fetch(`${BASE_URL}/theatres/${createdTheatreId}/screens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        screenNumber: 1,
        name: 'Screen 1 — Grand Laser',
        format: 'IMAX Laser',
        soundSystem: 'Dolby Atmos',
      }),
    });
    const data = await res.json();
    if (data.screen) createdScreenId = data.screen._id;
    assertTest(
      'POST /api/theatres/:id/screens - ADMIN can create screen with auto-generated seat layout (201)',
      res.status === 201 && data.success === true && data.screen.totalSeats === 142,
      `Screen total seats: ${data.screen?.totalSeats}`
    );
  } catch (err) {
    assertTest('POST /api/theatres/:id/screens - ADMIN can create screen', false, err.message);
  }

  // --- SUITE 4: VALIDATION & SHOWTIME CONFLICT PREVENTION ---
  console.log('\n--- SUITE 4: VALIDATION & SHOWTIME CONFLICT PREVENTION ---');

  // Test 12: Reject past showtime (400)
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const res = await fetch(`${BASE_URL}/showtimes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movie: sampleMovie._id,
        theatre: createdTheatreId,
        screen: createdScreenId,
        startTime: yesterday.toISOString(),
      }),
    });
    assertTest(
      'POST /api/showtimes - Reject scheduling showtime in the past with 400 Bad Request',
      res.status === 400,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/showtimes - Reject past showtime', false, err.message);
  }

  // Test 13: Reject invalid date format (400)
  try {
    const res = await fetch(`${BASE_URL}/showtimes?date=invalid-date-xyz`);
    assertTest(
      'GET /api/showtimes?date=invalid - Validate date format returning 400 Bad Request',
      res.status === 400,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('GET /api/showtimes?date=invalid - Validate date format', false, err.message);
  }

  // Test 14: Schedule valid future showtime A
  const slotStartA = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
  slotStartA.setHours(14, 0, 0, 0);
  const slotEndA = new Date(slotStartA.getTime() + 150 * 60000); // 2h 30m later
  let createdShowtimeAId;

  try {
    const res = await fetch(`${BASE_URL}/showtimes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movie: sampleMovie._id,
        theatre: createdTheatreId,
        screen: createdScreenId,
        startTime: slotStartA.toISOString(),
        endTime: slotEndA.toISOString(),
        tierPricing: {
          'VIP Recliner': 500,
          'Premium': 350,
          'Classic': 250,
        },
      }),
    });
    const data = await res.json();
    if (data.showtime) createdShowtimeAId = data.showtime._id;
    assertTest(
      'POST /api/showtimes - Schedule valid future showtime A on Screen (201)',
      res.status === 201 && data.success === true && !!createdShowtimeAId,
      `Showtime A ID: ${createdShowtimeAId}`
    );
  } catch (err) {
    assertTest('POST /api/showtimes - Schedule valid future showtime A', false, err.message);
  }

  // Test 15: Conflict Detection: Attempt overlapping showtime B on same screen (409 Conflict)
  // Show B starts 30 mins after Show A starts (direct overlap!)
  const slotStartB = new Date(slotStartA.getTime() + 30 * 60000);
  const slotEndB = new Date(slotStartB.getTime() + 120 * 60000);

  try {
    const res = await fetch(`${BASE_URL}/showtimes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movie: sampleMovie._id,
        theatre: createdTheatreId,
        screen: createdScreenId,
        startTime: slotStartB.toISOString(),
        endTime: slotEndB.toISOString(),
      }),
    });
    const data = await res.json();
    assertTest(
      'POST /api/showtimes - Reject overlapping showtime on same screen with 409 Conflict',
      res.status === 409 && data.success === false && !!data.conflict,
      `HTTP status: ${res.status}, Conflicting ID: ${data.conflict?.conflictingShowtimeId}`
    );
  } catch (err) {
    assertTest('POST /api/showtimes - Conflict collision detection', false, err.message);
  }

  // Test 16: Non-overlapping future showtime C succeeds (201)
  // Starts 30 mins after Show A ends
  const slotStartC = new Date(slotEndA.getTime() + 30 * 60000);
  const slotEndC = new Date(slotStartC.getTime() + 140 * 60000);
  let createdShowtimeCId;

  try {
    const res = await fetch(`${BASE_URL}/showtimes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movie: sampleMovie._id,
        theatre: createdTheatreId,
        screen: createdScreenId,
        startTime: slotStartC.toISOString(),
        endTime: slotEndC.toISOString(),
      }),
    });
    const data = await res.json();
    if (data.showtime) createdShowtimeCId = data.showtime._id;
    assertTest(
      'POST /api/showtimes - Allow non-overlapping sequential showtime on same screen (201)',
      res.status === 201 && data.success === true && !!createdShowtimeCId,
      `Showtime C ID: ${createdShowtimeCId}`
    );
  } catch (err) {
    assertTest('POST /api/showtimes - Allow non-overlapping showtime', false, err.message);
  }

  // --- SUITE 5: ADMIN UPDATE & CLEANUP ---
  console.log('\n--- SUITE 5: ADMIN UPDATE & CLEANUP ---');

  // Test 17: PUT /api/showtimes/:id - Update pricing & status
  try {
    const res = await fetch(`${BASE_URL}/showtimes/${createdShowtimeAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        tierPricing: {
          'VIP Recliner': 600,
          'Premium': 420,
          'Classic': 300,
        },
        status: 'fast-filling',
      }),
    });
    const data = await res.json();
    assertTest(
      'PUT /api/showtimes/:id - ADMIN updates showtime pricing and status (200)',
      res.status === 200 && data.showtime?.status === 'fast-filling' && data.showtime?.tierPricing?.['VIP Recliner'] === 600,
      `Status: ${data.showtime?.status}, VIP price: ₹${data.showtime?.tierPricing?.['VIP Recliner']}`
    );
  } catch (err) {
    assertTest('PUT /api/showtimes/:id - ADMIN updates showtime', false, err.message);
  }

  // Test 18: DELETE /api/showtimes/:id - Delete test showtime
  try {
    const res = await fetch(`${BASE_URL}/showtimes/${createdShowtimeAId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const data = await res.json();
    assertTest(
      'DELETE /api/showtimes/:id - ADMIN deletes showtime (200)',
      res.status === 200 && data.success === true,
      data.message
    );
  } catch (err) {
    assertTest('DELETE /api/showtimes/:id - ADMIN deletes showtime', false, err.message);
  }

  // Clean up other test items
  if (createdShowtimeCId) {
    await Showtime.findByIdAndDelete(createdShowtimeCId);
  }
  if (createdScreenId) {
    await Screen.findByIdAndDelete(createdScreenId);
  }
  if (createdTheatreId) {
    await Theatre.findByIdAndDelete(createdTheatreId);
  }

  // Summary
  console.log('\n=======================================');
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`📊 Test Results: ${totalPassed} / ${results.length} PASSED`);
  console.log('=======================================\n');

  await mongoose.disconnect();

  if (inProcessServer) {
    inProcessServer.close();
  }

  if (totalPassed < results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
