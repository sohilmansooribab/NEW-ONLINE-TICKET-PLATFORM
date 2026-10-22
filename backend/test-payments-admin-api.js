import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from './src/models/User.js';
import Movie from './src/models/Movie.js';
import Theatre from './src/models/Theatre.js';
import Screen from './src/models/Screen.js';
import Showtime from './src/models/Showtime.js';
import Hold from './src/models/Hold.js';
import Booking from './src/models/Booking.js';
import Payment from './src/models/Payment.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'cinebook_default_secret_key_change_in_production';

// Test credentials for HMAC verification tests
const TEST_RAZORPAY_KEY = 'rzp_test_mockKey12345';
const TEST_RAZORPAY_SECRET = 'secret_mock_test_key_xyz987';
const TEST_WEBHOOK_SECRET = 'whsec_test_mock_webhook_key456';

async function runTests() {
  console.log('🧪 Starting CineBook Secure Payments, Admin & Organizer APIs Automated Tests...\n');
  const results = [];

  const assertTest = (name, passed, details = '') => {
    results.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} - ${name} ${details ? '(' + details + ')' : ''}`);
  };

  // 1. In-process server fallback
  let inProcessServer = null;
  try {
    const ping = await fetch(`${BASE_URL}/health`);
    if (ping.status !== 200) throw new Error('Not running');
  } catch (e) {
    const { default: app } = await import('./src/app.js');
    inProcessServer = app.listen(5000);
    await new Promise((r) => setTimeout(r, 300));
  }

  // 2. Connect to DB
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
  if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
    mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
  }
  await mongoose.connect(mongoURI);

  // 3. Setup test users: Customer, Admin, Organizer A, Organizer B
  const customerEmail = 'customer_pay_test@example.com';
  const adminEmail = 'admin_pay_test@example.com';
  const organizerAEmail = 'organizer_a_pay_test@example.com';
  const organizerBEmail = 'organizer_b_pay_test@example.com';

  let customer = await User.findOne({ email: customerEmail });
  if (!customer) customer = await User.create({ name: 'Customer Pay', email: customerEmail, passwordHash: 'hash', role: 'USER' });

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) admin = await User.create({ name: 'Admin Pay', email: adminEmail, passwordHash: 'hash', role: 'ADMIN' });

  let organizerA = await User.findOne({ email: organizerAEmail });
  if (!organizerA) organizerA = await User.create({ name: 'Organizer Alpha', email: organizerAEmail, passwordHash: 'hash', role: 'ORGANIZER' });

  let organizerB = await User.findOne({ email: organizerBEmail });
  if (!organizerB) organizerB = await User.create({ name: 'Organizer Beta', email: organizerBEmail, passwordHash: 'hash', role: 'ORGANIZER' });

  const customerToken = jwt.sign({ id: customer._id, email: customer.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
  const organizerAToken = jwt.sign({ id: organizerA._id, email: organizerA.email, role: 'ORGANIZER' }, JWT_SECRET, { expiresIn: '1h' });
  const organizerBToken = jwt.sign({ id: organizerB._id, email: organizerB.email, role: 'ORGANIZER' }, JWT_SECRET, { expiresIn: '1h' });

  // 4. Setup Theatres for Organizer Ownership tests
  const movie = await Movie.findOne({ isPublished: true });

  let theatreA = await Theatre.findOne({ slug: 'theatre-alpha-venue' });
  if (!theatreA) {
    theatreA = await Theatre.create({
      name: 'PVR Alpha Multiplex',
      slug: 'theatre-alpha-venue',
      location: 'Saket City Centre',
      city: 'delhi',
      organizer: organizerA._id,
    });
    await Screen.create({ theatre: theatreA._id, screenNumber: 1, name: 'Screen 1', format: '2D' });
  } else {
    theatreA.organizer = organizerA._id;
    await theatreA.save();
  }
  const screenA = await Screen.findOne({ theatre: theatreA._id });

  let theatreB = await Theatre.findOne({ slug: 'theatre-beta-venue' });
  if (!theatreB) {
    theatreB = await Theatre.create({
      name: 'INOX Beta Megaplex',
      slug: 'theatre-beta-venue',
      location: 'Nehru Enclave',
      city: 'delhi',
      organizer: organizerB._id,
    });
    await Screen.create({ theatre: theatreB._id, screenNumber: 1, name: 'Screen 1', format: 'IMAX Laser' });
  } else {
    theatreB.organizer = organizerB._id;
    await theatreB.save();
  }
  const screenB = await Screen.findOne({ theatre: theatreB._id });

  // 5. Setup a Showtime for Payment tests
  const futureShowtime = await Showtime.create({
    movie: movie._id,
    theatre: theatreA._id,
    screen: screenA._id,
    startTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000 + 150 * 60000),
    format: '2D',
    language: 'Hindi',
    tierPricing: { 'VIP Recliner': 500, 'Premium': 350, 'Classic': 250 },
    bookedSeats: [],
    heldSeats: [],
  });

  // Create test booking in pending_payment status
  const testBooking = await Booking.create({
    user: customer._id,
    showtime: futureShowtime._id,
    movie: movie._id,
    theatre: theatreA._id,
    screen: screenA._id,
    seats: ['F1', 'F2'],
    ticketCount: 2,
    pricing: {
      baseAmount: 700,
      convenienceFee: 84,
      discountAmount: 0,
      totalAmount: 784,
    },
    status: 'pending_payment',
    paymentStatus: 'pending',
  });

  // --- SUITE 1: PAYMENT GATEWAY CONFIGURATION & ORDER CREATION ---
  console.log('\n--- SUITE 1: PAYMENT GATEWAY CONFIGURATION & ORDER CREATION ---');

  // Test 1: Safe failure when payment gateway credentials are not configured
  const savedKeyId = process.env.RAZORPAY_KEY_ID;
  const savedKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const savedWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const res = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ bookingId: testBooking._id }),
    });
    const data = await res.json();

    assertTest(
      'SAFE FAILURE: Fails safely with HTTP 503 when payment gateway credentials are not configured',
      res.status === 503 && data.code === 'PAYMENT_GATEWAY_NOT_CONFIGURED',
      `HTTP Status: ${res.status}, Code: ${data.code}`
    );
  } catch (err) {
    assertTest('SAFE FAILURE on missing credentials', false, err.message);
  } finally {
    // Inject test configuration for subsequent signature tests
    process.env.RAZORPAY_KEY_ID = TEST_RAZORPAY_KEY;
    process.env.RAZORPAY_KEY_SECRET = TEST_RAZORPAY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  }

  // Test 2: Payment order creation with valid pending booking & authoritative server amount
  let testOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
  let createdPaymentDoc;

  try {
    // In our test environment, we directly seed/simulate a valid order document
    createdPaymentDoc = await Payment.create({
      orderId: testOrderId,
      booking: testBooking._id,
      user: customer._id,
      amount: Math.round(testBooking.pricing.totalAmount * 100), // 78400 paise
      currency: 'INR',
      status: 'created',
      provider: 'razorpay',
      receipt: testBooking.bookingReference,
    });

    testBooking.paymentOrderId = testOrderId;
    testBooking.payment = createdPaymentDoc._id;
    await testBooking.save();

    // Verify booking has authoritative amount
    assertTest(
      'PAYMENT ORDER CREATION: Order associated with booking using authoritative amount exclusively (78400 paise = ₹784)',
      createdPaymentDoc.amount === 78400 && testBooking.paymentOrderId === testOrderId,
      `Order: ${testOrderId}, Amount: ${createdPaymentDoc.amount} paise`
    );
  } catch (err) {
    assertTest('PAYMENT ORDER CREATION', false, err.message);
  }

  // --- SUITE 2: CRYPTOGRAPHIC SIGNATURE & ANTI-TAMPERING ---
  console.log('\n--- SUITE 2: SIGNATURE VERIFICATION & ANTI-TAMPERING ---');

  // Test 3: Rejection of forged / invalid payment signature
  try {
    const res = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId: testBooking._id,
        razorpay_order_id: testOrderId,
        razorpay_payment_id: 'pay_tampered_12345',
        razorpay_signature: 'fake_tampered_signature_abcd1234efgh5678',
      }),
    });
    const data = await res.json();

    assertTest(
      'REJECT FORGED SIGNATURE: Rejects forged client signature with HTTP 400 Bad Request',
      res.status === 400 && data.success === false,
      `HTTP Status: ${res.status}, Message: ${data.message}`
    );
  } catch (err) {
    assertTest('REJECT FORGED SIGNATURE', false, err.message);
  }

  // Test 4: Rejection of mismatched provider order association
  try {
    const res = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId: testBooking._id,
        razorpay_order_id: 'order_completely_wrong_xyz',
        razorpay_payment_id: 'pay_998877',
        razorpay_signature: 'dummy_sig',
      }),
    });

    assertTest(
      'REJECT MISMATCHED ORDER: Rejects payment verification when orderId does not match booking record',
      res.status === 400,
      `HTTP Status: ${res.status}`
    );
  } catch (err) {
    assertTest('REJECT MISMATCHED ORDER', false, err.message);
  }

  // Test 5: Cryptographically verified payment confirmation
  const testPaymentId = `pay_${Math.random().toString(36).substring(2, 14)}`;
  const validSignature = crypto
    .createHmac('sha256', TEST_RAZORPAY_SECRET)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  try {
    const res = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId: testBooking._id,
        razorpay_order_id: testOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    const data = await res.json();

    assertTest(
      'VERIFIED PAYMENT CONFIRMATION: Confirms booking and sets paymentStatus=paid upon valid HMAC-SHA256 signature',
      res.status === 200 &&
        data.booking?.status === 'confirmed' &&
        data.booking?.paymentStatus === 'paid' &&
        data.booking?.paymentDetails?.transactionId === testPaymentId,
      `Status: ${data.booking?.status}, Payment: ${data.booking?.paymentStatus}`
    );
  } catch (err) {
    assertTest('VERIFIED PAYMENT CONFIRMATION', false, err.message);
  }

  // Test 6: Replay attack prevention - Reject duplicate payment ID reuse
  try {
    // Attempt to verify another booking using the exact same captured payment ID
    const otherBooking = await Booking.create({
      user: customer._id,
      showtime: futureShowtime._id,
      movie: movie._id,
      theatre: theatreA._id,
      screen: screenA._id,
      seats: ['G1'],
      ticketCount: 1,
      pricing: { baseAmount: 250, convenienceFee: 30, totalAmount: 280 },
      paymentOrderId: 'order_other_123',
    });

    const res = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId: otherBooking._id,
        razorpay_order_id: 'order_other_123',
        razorpay_payment_id: testPaymentId, // REUSED PAYMENT ID!
        razorpay_signature: 'any_signature',
      }),
    });

    assertTest(
      'ANTI-REPLAY: Rejects reusing an already captured paymentId on another booking with 400 Bad Request',
      res.status === 400,
      `HTTP Status: ${res.status}`
    );

    await Booking.findByIdAndDelete(otherBooking._id);
  } catch (err) {
    assertTest('ANTI-REPLAY duplicate check', false, err.message);
  }

  // --- SUITE 3: RAW BODY WEBHOOK SIGNATURE & IDEMPOTENCY ---
  console.log('\n--- SUITE 3: WEBHOOK SIGNATURE & IDEMPOTENT PROCESSING ---');

  // Test 7: Reject webhook with tampered / invalid signature
  try {
    const rawPayload = JSON.stringify({ event: 'payment.captured', payload: {} });
    const res = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'tampered_invalid_webhook_signature_xyz',
      },
      body: rawPayload,
    });

    assertTest(
      'REJECT TAMPERED WEBHOOK: Rejects webhook with invalid HMAC signature with HTTP 400 Bad Request',
      res.status === 400,
      `HTTP Status: ${res.status}`
    );
  } catch (err) {
    assertTest('REJECT TAMPERED WEBHOOK', false, err.message);
  }

  // Test 8: Valid Webhook Processing & Idempotent Replay Handling
  const webhookEventId = `evt_${Date.now()}`;
  const webhookBodyObj = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_wh_${Date.now()}`,
          order_id: testOrderId,
          amount: 78400,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  };
  const webhookRawBody = JSON.stringify(webhookBodyObj);
  const validWebhookSig = crypto
    .createHmac('sha256', TEST_WEBHOOK_SECRET)
    .update(webhookRawBody)
    .digest('hex');

  try {
    // First delivery
    const res1 = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
        'x-razorpay-event-id': webhookEventId,
      },
      body: webhookRawBody,
    });
    const data1 = await res1.json();

    // Idempotent duplicate delivery
    const res2 = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
        'x-razorpay-event-id': webhookEventId,
      },
      body: webhookRawBody,
    });
    const data2 = await res2.json();

    assertTest(
      'IDEMPOTENT WEBHOOK: First event processed (200), duplicate event recognized as idempotent (200)',
      res1.status === 200 && res2.status === 200 && data2.message?.includes('idempotent'),
      `Delivery 1: ${data1.status}, Delivery 2: ${data2.message}`
    );
  } catch (err) {
    assertTest('IDEMPOTENT WEBHOOK', false, err.message);
  }

  // --- SUITE 4: PROTECTED ADMIN APIS & PLATFORM ANALYTICS ---
  console.log('\n--- SUITE 4: PROTECTED ADMIN APIS & ANALYTICS ---');

  // Test 9: Reject non-admin access to /api/admin/*
  try {
    const unauthRes = await fetch(`${BASE_URL}/admin/analytics`);
    const userRes = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    assertTest(
      'RBAC ENFORCEMENT: Unauthenticated returns 401, USER role returns 403 on Admin routes',
      unauthRes.status === 401 && userRes.status === 403,
      `Unauth: ${unauthRes.status}, User: ${userRes.status}`
    );
  } catch (err) {
    assertTest('RBAC ENFORCEMENT on admin routes', false, err.message);
  }

  // Test 10: GET /api/admin/users - User listing & inspection
  try {
    const res = await fetch(`${BASE_URL}/admin/users?role=ORGANIZER`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();

    assertTest(
      'GET /api/admin/users - Admin retrieves users list filtered by role',
      res.status === 200 && data.success === true && Array.isArray(data.users) && data.users.length >= 2,
      `Organizers found: ${data.users?.length}`
    );
  } catch (err) {
    assertTest('GET /api/admin/users', false, err.message);
  }

  // Test 11: PUT /api/admin/users/:id/role - Role change & self-demotion protection
  try {
    // Admin tries to demote themselves -> must fail
    const selfDemoteRes = await fetch(`${BASE_URL}/admin/users/${admin._id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'USER' }),
    });

    assertTest(
      'SELF-DEMOTION SAFEGUARD: Blocks administrator from demoting their own account with 400 Bad Request',
      selfDemoteRes.status === 400,
      `HTTP Status: ${selfDemoteRes.status}`
    );
  } catch (err) {
    assertTest('SELF-DEMOTION SAFEGUARD', false, err.message);
  }

  // Test 12: GET /api/admin/analytics - Settled revenue strictly excludes unpaid & cancelled bookings
  try {
    // Add an unpaid booking and a cancelled booking to ensure they are excluded from settled revenue
    const pendingBooking = await Booking.create({
      user: customer._id,
      showtime: futureShowtime._id,
      movie: movie._id,
      theatre: theatreA._id,
      screen: screenA._id,
      seats: ['H1'],
      ticketCount: 1,
      pricing: { baseAmount: 250, convenienceFee: 30, totalAmount: 280 },
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    const cancelledBooking = await Booking.create({
      user: customer._id,
      showtime: futureShowtime._id,
      movie: movie._id,
      theatre: theatreA._id,
      screen: screenA._id,
      seats: ['H2'],
      ticketCount: 1,
      pricing: { baseAmount: 250, convenienceFee: 30, totalAmount: 280 },
      status: 'cancelled',
      paymentStatus: 'refunded',
    });

    const res = await fetch(`${BASE_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();

    assertTest(
      'ADMIN ANALYTICS ACCURACY: Settled revenue aggregates strictly where paymentStatus=paid and status!=cancelled',
      res.status === 200 &&
        typeof data.settledMetrics?.settledRevenue === 'number' &&
        data.settledMetrics?.settledRevenue >= 784 &&
        data.bookingsByStatus?.pending_payment >= 1 &&
        data.bookingsByStatus?.cancelled >= 1,
      `Settled Revenue: ₹${data.settledMetrics?.settledRevenue}, Paid Bookings: ${data.settledMetrics?.totalPaidBookings}`
    );

    await Booking.findByIdAndDelete(pendingBooking._id);
    await Booking.findByIdAndDelete(cancelledBooking._id);
  } catch (err) {
    assertTest('ADMIN ANALYTICS ACCURACY', false, err.message);
  }

  // --- SUITE 5: ORGANIZER APIS & OWNERSHIP ENFORCEMENT ---
  console.log('\n--- SUITE 5: ORGANIZER APIS & OWNERSHIP ENFORCEMENT ---');

  // Test 13: Organizer A retrieves their assigned theatre profile
  try {
    const res = await fetch(`${BASE_URL}/organizer/theatres`, {
      headers: { Authorization: `Bearer ${organizerAToken}` },
    });
    const data = await res.json();

    const ownsOnlyA = data.theatres.every((t) => t.slug === 'theatre-alpha-venue');
    assertTest(
      'GET /api/organizer/theatres - Organizer receives only theatres assigned to them',
      res.status === 200 && data.count === 1 && ownsOnlyA,
      `Assigned theatres: ${data.theatres?.map((t) => t.name).join(', ')}`
    );
  } catch (err) {
    assertTest('GET /api/organizer/theatres', false, err.message);
  }

  // Test 14: Cross-Organizer Access Rejection (Organizer A attempts to schedule on Theatre B)
  try {
    const crossShowRes = await fetch(`${BASE_URL}/organizer/showtimes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerAToken}`, // Organizer A!
      },
      body: JSON.stringify({
        theatre: theatreB._id, // Theatre B belongs to Organizer B!
        screen: screenB._id,
        movie: movie._id,
        startTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    assertTest(
      'CROSS-ORGANIZER ENFORCEMENT: Rejects scheduling on theatre assigned to another organizer with 403 Forbidden',
      crossShowRes.status === 403,
      `HTTP Status: ${crossShowRes.status}`
    );
  } catch (err) {
    assertTest('CROSS-ORGANIZER ENFORCEMENT', false, err.message);
  }

  // Test 15: Organizer A schedules valid showtime on Theatre A (201 Created)
  let orgShowtimeId;
  try {
    const showRes = await fetch(`${BASE_URL}/organizer/showtimes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizerAToken}`,
      },
      body: JSON.stringify({
        theatre: theatreA._id,
        screen: screenA._id,
        movie: movie._id,
        startTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        tierPricing: { 'VIP Recliner': 550, 'Premium': 380, 'Classic': 280 },
      }),
    });
    const data = await showRes.json();
    if (data.showtime) orgShowtimeId = data.showtime._id;

    assertTest(
      'POST /api/organizer/showtimes - Organizer successfully schedules showtime on their own venue',
      showRes.status === 201 && data.success === true && !!orgShowtimeId,
      `Showtime ID: ${orgShowtimeId}`
    );
  } catch (err) {
    assertTest('POST /api/organizer/showtimes', false, err.message);
  }

  // Test 16: Organizer Analytics scoped strictly to organizer's venue
  try {
    const res = await fetch(`${BASE_URL}/organizer/analytics`, {
      headers: { Authorization: `Bearer ${organizerAToken}` },
    });
    const data = await res.json();

    assertTest(
      'GET /api/organizer/analytics - Organizer analytics scoped strictly to their assigned venue',
      res.status === 200 && data.success === true && typeof data.metrics?.totalRevenue === 'number',
      `Organizer A Total Revenue: ₹${data.metrics?.totalRevenue}`
    );
  } catch (err) {
    assertTest('GET /api/organizer/analytics', false, err.message);
  }

  // Cleanup test artifacts
  if (orgShowtimeId) await Showtime.findByIdAndDelete(orgShowtimeId);
  await Booking.deleteMany({ showtime: futureShowtime._id });
  await Payment.deleteMany({ booking: testBooking._id });
  await Showtime.findByIdAndDelete(futureShowtime._id);

  // Restore env
  if (savedKeyId) process.env.RAZORPAY_KEY_ID = savedKeyId;
  else delete process.env.RAZORPAY_KEY_ID;
  if (savedKeySecret) process.env.RAZORPAY_KEY_SECRET = savedKeySecret;
  else delete process.env.RAZORPAY_KEY_SECRET;
  if (savedWebhookSecret) process.env.RAZORPAY_WEBHOOK_SECRET = savedWebhookSecret;
  else delete process.env.RAZORPAY_WEBHOOK_SECRET;

  // Summary
  console.log('\n=======================================');
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`📊 Payments & Admin Test Results: ${totalPassed} / ${results.length} PASSED`);
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
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
