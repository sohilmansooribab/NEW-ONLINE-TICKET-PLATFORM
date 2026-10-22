import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import Movie from './src/models/Movie.js';
import Theatre from './src/models/Theatre.js';
import Screen from './src/models/Screen.js';
import Showtime from './src/models/Showtime.js';
import Hold from './src/models/Hold.js';
import Booking from './src/models/Booking.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'cinebook_default_secret_key_change_in_production';

async function runTests() {
  console.log('🧪 Starting CineBook Seat-Hold & Booking Workflow Automated Tests...\n');
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
    // Port 5000 server not running, spin up in-process app instance
    const { default: app } = await import('./src/app.js');
    inProcessServer = app.listen(5000);
    await new Promise((r) => setTimeout(r, 300));
  }

  // Connect to DB for test setup
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
  if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
    mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
  }
  await mongoose.connect(mongoURI);

  // 1. Setup Test Users: User A, User B, Admin
  const emailA = 'alice_booking_test@example.com';
  const emailB = 'bob_booking_test@example.com';
  const emailAdmin = 'admin_booking_test@example.com';

  let userA = await User.findOne({ email: emailA });
  if (!userA) {
    userA = await User.create({ name: 'Alice Test', email: emailA, passwordHash: 'hash', role: 'USER' });
  }

  let userB = await User.findOne({ email: emailB });
  if (!userB) {
    userB = await User.create({ name: 'Bob Test', email: emailB, passwordHash: 'hash', role: 'USER' });
  }

  let userAdmin = await User.findOne({ email: emailAdmin });
  if (!userAdmin) {
    userAdmin = await User.create({ name: 'Admin Test', email: emailAdmin, passwordHash: 'hash', role: 'ADMIN' });
  }

  const tokenA = jwt.sign({ id: userA._id, email: userA.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB._id, email: userB.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenAdmin = jwt.sign({ id: userAdmin._id, email: userAdmin.email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  // 2. Setup isolated Showtime for booking tests
  const movie = await Movie.findOne({ isPublished: true });
  const theatre = await Theatre.findOne({ slug: 'pvr-directors-cut' });
  const screen = await Screen.findOne({ theatre: theatre._id, screenNumber: 1 });

  const testStartTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days in future
  testStartTime.setHours(19, 0, 0, 0);
  const testEndTime = new Date(testStartTime.getTime() + 150 * 60000);

  // Clean any previous test showtimes with this screen & time
  await Showtime.deleteMany({ screen: screen._id, startTime: testStartTime });

  const testShowtime = await Showtime.create({
    movie: movie._id,
    theatre: theatre._id,
    screen: screen._id,
    startTime: testStartTime,
    endTime: testEndTime,
    format: 'IMAX Laser',
    language: 'Hindi',
    tierPricing: {
      'VIP Recliner': 520,
      'Premium': 380,
      'Classic': 280,
    },
    bookedSeats: [
      { seatId: 'A5' }, // Pre-booked seat for testing conflict
    ],
    heldSeats: [],
    status: 'available',
    cancellationAvailable: true,
  });

  const showtimeId = testShowtime._id.toString();

  // --- SUITE 1: SEAT HOLD & AUTHORITATIVE PRICING ---
  console.log('\n--- SUITE 1: SEAT HOLD & AUTHORITATIVE PRICING ---');

  // Test 1: POST /api/bookings/hold - Valid seat hold with authoritative pricing
  let hold1Id;
  try {
    const res = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        showtimeId,
        seats: ['A1', 'A2'], // 2x VIP Recliner (520 each = 1040 base, 12% fee = 125, total = 1165)
        durationSeconds: 300,
      }),
    });
    const data = await res.json();
    if (data.holdId) hold1Id = data.holdId;

    const baseExpected = 1040;
    const feeExpected = Math.round(baseExpected * 0.12);
    const totalExpected = baseExpected + feeExpected;

    assertTest(
      'POST /api/bookings/hold - Acquire temporary seat hold with authoritative pricing',
      res.status === 201 &&
        data.success === true &&
        data.seats?.length === 2 &&
        data.pricing?.baseAmount === baseExpected &&
        data.pricing?.totalAmount === totalExpected,
      `Base: ₹${data.pricing?.baseAmount}, Total: ₹${data.pricing?.totalAmount}, Expiry: ${data.expiresInSeconds}s`
    );
  } catch (err) {
    assertTest('POST /api/bookings/hold - Acquire temporary hold', false, err.message);
  }

  // Test 2: Reject holding already booked seat (A5)
  try {
    const res = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        showtimeId,
        seats: ['A5'], // already booked in testShowtime setup
      }),
    });
    assertTest(
      'POST /api/bookings/hold - Reject holding already booked seat with 409 Conflict',
      res.status === 409,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/bookings/hold - Reject already booked seat', false, err.message);
  }

  // Test 3: Reject holding currently held seat (A1 held by Alice)
  try {
    const res = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        showtimeId,
        seats: ['A1'], // Currently held by Alice
      }),
    });
    assertTest(
      'POST /api/bookings/hold - Reject holding seat held by another user with 409 Conflict',
      res.status === 409,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/bookings/hold - Reject held seat', false, err.message);
  }

  // --- SUITE 2: CONCURRENCY RACE CONDITION DEFENSE ---
  console.log('\n--- SUITE 2: CONCURRENCY RACE CONDITION DEFENSE ---');

  // Test 4: True Concurrency Test - 5 simultaneous requests attempting to hold the EXACT SAME seat 'B1'
  try {
    const targetSeat = 'B1';
    const concurrentRequests = Array.from({ length: 5 }, (_, i) => {
      // Rotate between tokens or distinct users
      const token = i % 2 === 0 ? tokenA : tokenB;
      return fetch(`${BASE_URL}/bookings/hold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          showtimeId,
          seats: [targetSeat],
          durationSeconds: 300,
        }),
      });
    });

    const responses = await Promise.all(concurrentRequests);
    const statuses = await Promise.all(
      responses.map(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const successCount = statuses.filter((s) => s.status === 201).length;
    const conflictCount = statuses.filter((s) => s.status === 409).length;

    assertTest(
      'CONCURRENCY: 5 simultaneous requests for same seat - Exactly 1 wins (201), 4 rejected (409)',
      successCount === 1 && conflictCount === 4,
      `Successes: ${successCount}, Conflicts: ${conflictCount}`
    );
  } catch (err) {
    assertTest('CONCURRENCY: Simultaneous requests for same seat', false, err.message);
  }

  // --- SUITE 3: HOLD RELEASE & EXPIRATION RECLAIMING ---
  console.log('\n--- SUITE 3: HOLD RELEASE & EXPIRATION RECLAIMING ---');

  // Test 5: DELETE /api/bookings/hold/:holdId - Release hold early
  let holdToReleaseId;
  try {
    // Alice holds 'C1'
    const holdRes = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ showtimeId, seats: ['C1'] }),
    });
    const holdData = await holdRes.json();
    holdToReleaseId = holdData.holdId;

    // Alice releases 'C1'
    const releaseRes = await fetch(`${BASE_URL}/bookings/hold/${holdToReleaseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const releaseData = await releaseRes.json();

    // Now Bob can hold 'C1' immediately
    const bobRes = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ showtimeId, seats: ['C1'] }),
    });

    assertTest(
      'DELETE /api/bookings/hold/:holdId - Release hold frees seat immediately for other users',
      releaseRes.status === 200 && releaseData.success === true && bobRes.status === 201,
      `Bob acquired released seat: ${bobRes.status === 201}`
    );
  } catch (err) {
    assertTest('DELETE /api/bookings/hold/:holdId - Release hold', false, err.message);
  }

  // Test 6: Expired Hold Reclaiming
  try {
    // Create hold with short expiry
    const shortHoldRes = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ showtimeId, seats: ['D1'], durationSeconds: 5 }),
    });
    const shortHoldData = await shortHoldRes.json();

    // Fast-forward expiration in database directly to simulate passage of 5 minutes
    await Hold.findByIdAndUpdate(shortHoldData.holdId, { expiresAt: new Date(Date.now() - 1000) });
    await Showtime.updateOne(
      { _id: showtimeId, 'heldSeats.holdId': shortHoldData.holdId },
      { $set: { 'heldSeats.$.expiresAt': new Date(Date.now() - 1000) } }
    );

    // Bob attempts to hold 'D1' now that Alice's hold has expired
    const reclaimRes = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ showtimeId, seats: ['D1'] }),
    });

    assertTest(
      'EXPIRED HOLD RECLAIMING: Expired hold can be acquired by another user (201)',
      reclaimRes.status === 201,
      `HTTP status: ${reclaimRes.status}`
    );
  } catch (err) {
    assertTest('EXPIRED HOLD RECLAIMING', false, err.message);
  }

  // --- SUITE 4: BOOKING CREATION, IDEMPOTENCY & AUTHORITATIVE PRICE ---
  console.log('\n--- SUITE 4: BOOKING CREATION, IDEMPOTENCY & PRICING ---');

  // Test 7: POST /api/bookings - Create booking from active hold (Alice holds E1, E2)
  let activeHoldId;
  let createdBookingId;
  let createdBookingRef;
  const testIdempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    const holdRes = await fetch(`${BASE_URL}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ showtimeId, seats: ['E1', 'E2'] }),
    });
    const holdData = await holdRes.json();
    activeHoldId = holdData.holdId;

    // Alice attempts booking with manipulated client total amount in payload ({ totalAmount: 10 })
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        holdId: activeHoldId,
        idempotencyKey: testIdempotencyKey,
        totalAmount: 10, // Manipulated price! Must be ignored by backend!
        contactDetails: {
          name: 'Alice In Wonderland',
          email: 'alice@example.com',
          phone: '+91 99999 88888',
        },
      }),
    });
    const bookData = await bookRes.json();
    if (bookData.booking) {
      createdBookingId = bookData.booking.id;
      createdBookingRef = bookData.booking.bookingReference;
    }

    // E1 & E2 are Premium tier (380 each = 760, fee = 91, total = 851)
    const expectedBase = 760;
    const expectedFee = Math.round(expectedBase * 0.12);
    const expectedTotal = expectedBase + expectedFee;

    assertTest(
      'POST /api/bookings - Create booking enforcing authoritative price & ignoring client total',
      bookRes.status === 201 &&
        bookData.success === true &&
        bookData.booking?.pricing?.totalAmount === expectedTotal &&
        bookData.booking?.paymentStatus === 'pending',
      `Auth Total: ₹${bookData.booking?.pricing?.totalAmount} (Manipulated ₹10 ignored), Status: ${bookData.booking?.status}`
    );
  } catch (err) {
    assertTest('POST /api/bookings - Create booking from hold', false, err.message);
  }

  // Test 8: Idempotency Replay - Retry with same idempotencyKey
  try {
    const retryRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        holdId: activeHoldId,
        idempotencyKey: testIdempotencyKey,
      }),
    });
    const retryData = await retryRes.json();

    assertTest(
      'IDEMPOTENCY: Duplicate retry with same idempotencyKey returns existing booking without duplicate',
      retryRes.status === 200 &&
        retryData.isIdempotentReplay === true &&
        (retryData.booking?._id === createdBookingId || retryData.booking?.id === createdBookingId),
      `Replayed Reference: ${retryData.booking?.bookingReference}`
    );
  } catch (err) {
    assertTest('IDEMPOTENCY duplicate retry', false, err.message);
  }

  // Test 9: Reject booking with already converted hold
  try {
    const dupRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        holdId: activeHoldId,
        idempotencyKey: 'different_new_key',
      }),
    });
    assertTest(
      'POST /api/bookings - Reject booking attempt on already converted hold',
      dupRes.status === 400,
      `HTTP status: ${dupRes.status}`
    );
  } catch (err) {
    assertTest('POST /api/bookings - Reject converted hold', false, err.message);
  }

  // --- SUITE 5: PAYMENT SEPARATION & STATUS ---
  console.log('\n--- SUITE 5: PAYMENT SEPARATION & STATUS ---');

  // Test 10: GET /api/bookings/:id/status - Lightweight status
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}/status`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data = await res.json();
    assertTest(
      'GET /api/bookings/:id/status - Retrieve lightweight booking & payment status',
      res.status === 200 && data.status === 'pending_payment' && data.paymentStatus === 'pending',
      `Status: ${data.status}, Payment: ${data.paymentStatus}`
    );
  } catch (err) {
    assertTest('GET /api/bookings/:id/status', false, err.message);
  }

  // Test 11: POST /api/bookings/:id/confirm-payment - Confirm payment
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        provider: 'razorpay',
        transactionId: 'txn_mock_998877',
      }),
    });
    const data = await res.json();

    assertTest(
      'POST /api/bookings/:id/confirm-payment - Transition booking to confirmed and paid after provider verification',
      res.status === 200 && data.booking?.status === 'confirmed' && data.booking?.paymentStatus === 'paid',
      `Status: ${data.booking?.status}, Payment: ${data.booking?.paymentStatus}, Tx: ${data.booking?.paymentDetails?.transactionId}`
    );
  } catch (err) {
    assertTest('POST /api/bookings/:id/confirm-payment', false, err.message);
  }

  // --- SUITE 6: ACCESS CONTROL (RBAC & DATA ISOLATION) ---
  console.log('\n--- SUITE 6: ACCESS CONTROL & DATA ISOLATION ---');

  // Test 12: GET /api/bookings/my - User personal bookings
  try {
    const res = await fetch(`${BASE_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data = await res.json();
    const allBelongToAlice = data.bookings.every((b) => b.user.toString() === userA._id.toString());
    assertTest(
      'GET /api/bookings/my - Returns authenticated user personal bookings only',
      res.status === 200 && data.count >= 1 && allBelongToAlice,
      `User A has ${data.count} bookings`
    );
  } catch (err) {
    assertTest('GET /api/bookings/my', false, err.message);
  }

  // Test 13: Bob cannot view Alice's booking (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assertTest(
      "GET /api/bookings/:id - Reject unauthorized user with 403 Forbidden",
      res.status === 403,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('GET /api/bookings/:id - Unauthorized access', false, err.message);
  }

  // Test 14: ADMIN can view any user's booking (200 OK)
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data = await res.json();
    assertTest(
      "GET /api/bookings/:id - Explicitly authorized ADMIN can view user's booking",
      res.status === 200 && data.success === true && !!data.booking,
      `Admin retrieved booking: ${data.booking?.bookingReference}`
    );
  } catch (err) {
    assertTest('GET /api/bookings/:id - Admin access', false, err.message);
  }

  // --- SUITE 7: CANCELLATION RULES & SEAT RESTORATION ---
  console.log('\n--- SUITE 7: CANCELLATION RULES & SEAT RESTORATION ---');

  // Test 15: Bob cannot cancel Alice's booking (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ reason: 'Malicious attempt' }),
    });
    assertTest(
      'POST /api/bookings/:id/cancel - Reject unauthorized cancellation attempt with 403 Forbidden',
      res.status === 403,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/bookings/:id/cancel - Unauthorized', false, err.message);
  }

  // Test 16: Alice cancels her own booking -> seats restored to inventory
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Change of plans' }),
    });
    const data = await res.json();

    // Verify seats E1 & E2 are no longer in showtime.bookedSeats
    const refreshedShowtime = await Showtime.findById(showtimeId);
    const bookedSeatIds = refreshedShowtime.bookedSeats.map((b) => b.seatId);
    const seatsRestored = !bookedSeatIds.includes('E1') && !bookedSeatIds.includes('E2');

    assertTest(
      'POST /api/bookings/:id/cancel - Cancel booking and atomically restore seats to available inventory',
      res.status === 200 &&
        data.booking?.status === 'cancelled' &&
        data.booking?.paymentStatus === 'refunded' &&
        seatsRestored,
      `Status: ${data.booking?.status}, Refund: ${data.booking?.paymentStatus}, Seats Restored: ${seatsRestored}`
    );
  } catch (err) {
    assertTest('POST /api/bookings/:id/cancel - Successful cancellation', false, err.message);
  }

  // Test 17: Cannot cancel an already cancelled booking
  try {
    const res = await fetch(`${BASE_URL}/bookings/${createdBookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Try again' }),
    });
    assertTest(
      'POST /api/bookings/:id/cancel - Reject cancelling already cancelled booking with 400 Bad Request',
      res.status === 400,
      `HTTP status: ${res.status}`
    );
  } catch (err) {
    assertTest('POST /api/bookings/:id/cancel - Duplicate cancel', false, err.message);
  }

  // Clean up test showtime and bookings
  await Booking.deleteMany({ showtime: showtimeId });
  await Hold.deleteMany({ showtime: showtimeId });
  await Showtime.findByIdAndDelete(showtimeId);

  // Summary
  console.log('\n=======================================');
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`📊 Booking & Hold Test Results: ${totalPassed} / ${results.length} PASSED`);
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
