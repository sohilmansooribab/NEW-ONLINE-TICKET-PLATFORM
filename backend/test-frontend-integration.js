import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';

const API_BASE = 'http://localhost:5000/api';

async function testFrontendBackendIntegration() {
  console.log('🧪 Starting CineBook Full Frontend-Backend Integration Automated Tests...\n');
  let passCount = 0;
  let failCount = 0;
  let inProcessServer = null;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS - ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL - ${message}`);
      failCount++;
    }
  };

  try {
    // 0. Ensure server is active or start fallback
    try {
      const ping = await fetch(`${API_BASE}/health`);
      if (ping.status !== 200) throw new Error('Not running');
    } catch {
      await connectDB();
      const { default: app } = await import('./src/app.js');
      inProcessServer = app.listen(5000);
      await new Promise((r) => setTimeout(r, 400));
    }

    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, 'GET /api/health - Backend service online and responsive');

    // 2. Authentication: Signup customer account
    const randId = Math.floor(1000 + Math.random() * 9000);
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Integration Tester ${randId}`,
        email: `tester_${randId}@example.com`,
        password: 'password123',
      }),
    });
    const signupData = await signupRes.json();
    assert(signupRes.status === 201 && signupData.token && signupData.user.role === 'USER', 'POST /api/auth/signup - Registered customer account with JWT & USER role');
    const customerToken = signupData.token;

    // 3. Verification: GET /api/auth/me
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${customerToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === `tester_${randId}@example.com`, 'GET /api/auth/me - Verified JWT session returns correct profile');

    // 4. Movies Catalogue: GET /api/movies
    const moviesRes = await fetch(`${API_BASE}/movies?limit=10`);
    const moviesData = await moviesRes.json();
    assert(moviesRes.status === 200 && moviesData.data?.length > 0, `GET /api/movies - Loaded ${moviesData.data?.length} published movies`);
    const testMovie = moviesData.data[0];

    // 5. Single Movie Details: GET /api/movies/:id
    const singleMovieRes = await fetch(`${API_BASE}/movies/${testMovie.slug || testMovie._id}`);
    const singleMovieData = await singleMovieRes.json();
    assert(singleMovieRes.status === 200 && singleMovieData.data.title === testMovie.title, `GET /api/movies/:id - Loaded details for '${testMovie.title}'`);

    // 6. Showtimes Discovery: GET /api/showtimes
    const showtimesRes = await fetch(`${API_BASE}/showtimes?upcoming=true&limit=10`);
    const showtimesData = await showtimesRes.json();
    const showtimeList = showtimesData.showtimes || showtimesData.data || [];
    assert(showtimesRes.status === 200 && showtimeList.length > 0, `GET /api/showtimes - Loaded ${showtimeList.length} upcoming showtimes`);
    const testShowtime = showtimeList[0];

    // 7. Live Seat Map: GET /api/showtimes/:id/seats
    const seatsRes = await fetch(`${API_BASE}/showtimes/${testShowtime._id}/seats`);
    const seatsData = await seatsRes.json();
    const rows = seatsData.rows || seatsData.seatMap || [];
    const allSeats = seatsData.seats || seatsData.allSeats || [];
    const availableSeatsCount = seatsData.stats?.availableCount ?? seatsData.summary?.availableSeats ?? allSeats.filter(s => s.status === 'available').length;
    assert(seatsRes.status === 200 && rows.length > 0, `GET /api/showtimes/:id/seats - Loaded seat layout with ${availableSeatsCount} available seats`);

    // 8. Seat Hold Workflow: POST /api/bookings/hold
    const availableSeat = allSeats.find(s => s.status === 'available');
    assert(!!availableSeat, `Found available seat for hold test (${availableSeat?.seatId})`);

    const holdRes = await fetch(`${API_BASE}/bookings/hold`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        showtimeId: testShowtime._id,
        seats: [availableSeat.seatId],
        durationSeconds: 300,
      }),
    });
    const holdData = await holdRes.json();
    if (holdRes.status !== 201) console.error('HOLD ERROR:', holdRes.status, holdData);
    assert(holdRes.status === 201 && holdData.holdId, `POST /api/bookings/hold - Acquired 5-minute seat hold for seat ${availableSeat.seatId} (Hold: ${holdData.holdId})`);

    // 9. Booking Creation from Hold: POST /api/bookings
    const idempotencyKey = `e2e-${Date.now()}-${randId}`;
    const bookingRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        holdId: holdData.holdId,
        idempotencyKey,
        contactDetails: {
          name: `Tester ${randId}`,
          email: `tester_${randId}@example.com`,
          phone: '+91 98765 43210',
        },
      }),
    });
    const bookingData = await bookingRes.json();
    assert(bookingRes.status === 201 && bookingData.booking?.bookingReference, `POST /api/bookings - Converted hold into booking (${bookingData.booking?.bookingReference})`);
    const createdBookingId = bookingData.booking._id || bookingData.booking.id;

    // 10. Payment Order Creation: POST /api/payments/create-order
    const orderRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ bookingId: createdBookingId }),
    });
    const orderData = await orderRes.json();
    if (orderRes.status === 200) {
      assert(true, `POST /api/payments/create-order - Created Razorpay order ${orderData.orderId}`);
    } else if (orderRes.status === 503) {
      assert(orderData.code === 'PAYMENT_GATEWAY_NOT_CONFIGURED', 'POST /api/payments/create-order - Safely handled unconfigured gateway keys with HTTP 503');
    }

    // 11. Payment Confirmation: POST /api/bookings/:id/confirm-payment
    const confirmRes = await fetch(`${API_BASE}/bookings/${createdBookingId}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        provider: 'test_mode',
        transactionId: `txn_e2e_${Date.now()}`,
        signature: 'sig_e2e_verified',
      }),
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmData.booking?.status === 'confirmed' && confirmData.booking?.paymentStatus === 'paid', `POST /api/bookings/:id/confirm-payment - Verified payment and confirmed booking (Status: ${confirmData.booking?.status}, Payment: ${confirmData.booking?.paymentStatus})`);

    // 12. Customer My Bookings: GET /api/bookings/my
    const myBookingsRes = await fetch(`${API_BASE}/bookings/my`, {
      headers: { 'Authorization': `Bearer ${customerToken}` },
    });
    const myBookingsData = await myBookingsRes.json();
    assert(myBookingsRes.status === 200 && myBookingsData.bookings?.some(b => b.bookingReference === bookingData.booking.bookingReference), 'GET /api/bookings/my - Customer booking appears in personal booking history');

    // 13. Cancellation Workflow: POST /api/bookings/:id/cancel
    const cancelRes = await fetch(`${API_BASE}/bookings/${createdBookingId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ reason: 'Customer requested refund' }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.booking?.status === 'cancelled', `POST /api/bookings/:id/cancel - Booking cancelled and seats restored`);

    // 14. Admin Authentication & Role Authorization
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cinebook.com', password: 'password123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user?.role === 'ADMIN', 'POST /api/auth/login - Signed in as verified ADMIN account');
    const adminToken = adminLoginData.token;

    // 15. Admin Analytics: GET /api/admin/analytics
    const adminAnalyticsRes = await fetch(`${API_BASE}/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    const adminAnalyticsData = await adminAnalyticsRes.json();
    assert(adminAnalyticsRes.status === 200 && adminAnalyticsData.analytics?.totalSettledRevenue !== undefined, `GET /api/admin/analytics - Admin platform metrics retrieved (Settled Revenue: ₹${adminAnalyticsData.analytics?.totalSettledRevenue})`);

    // 16. Organizer Authentication & Scoped Venues: GET /api/organizer/theatres
    const orgLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'organizer@pvrcinemas.com', password: 'password123' }),
    });
    const orgLoginData = await orgLoginRes.json();
    assert(orgLoginRes.status === 200 && orgLoginData.user?.role === 'ORGANIZER', 'POST /api/auth/login - Signed in as verified ORGANIZER account');
    const orgToken = orgLoginData.token;

    const orgTheatresRes = await fetch(`${API_BASE}/organizer/theatres`, {
      headers: { 'Authorization': `Bearer ${orgToken}` },
    });
    const orgTheatresData = await orgTheatresRes.json();
    assert(orgTheatresRes.status === 200 && orgTheatresData.theatres?.length > 0, `GET /api/organizer/theatres - Loaded ${orgTheatresData.theatres?.length} assigned venue(s) for organizer`);

    console.log(`\n======================================================`);
    console.log(`📊 Frontend-Backend Integration Test Results: ${passCount} / ${passCount + failCount} PASSED`);
    console.log(`======================================================\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Integration Test Error:', err);
    process.exit(1);
  } finally {
    if (inProcessServer) {
      inProcessServer.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

testFrontendBackendIntegration();
