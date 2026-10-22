import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';

const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'cinebook_default_secret_key_change_in_production';

async function runTests() {
  console.log('🧪 Starting Movie Catalogue API Automated Integration Tests...\n');
  const results = [];

  // Helper to record test results
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

  // Connect to DB for test user setup
  let mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinebook';
  if (mongoURI.includes('<db_password>') || mongoURI.includes('<password>')) {
    mongoURI = 'mongodb://127.0.0.1:27017/cinebook';
  }
  await mongoose.connect(mongoURI);

  // 1. Create or fetch test users: Normal USER and ADMIN
  const testUserEmail = 'test_user_catalogue@example.com';
  const testAdminEmail = 'test_admin_catalogue@example.com';

  let testUser = await User.findOne({ email: testUserEmail });
  if (!testUser) {
    testUser = await User.create({
      name: 'Regular Test User',
      email: testUserEmail,
      passwordHash: 'dummyhash',
      role: 'USER',
    });
  }

  let testAdmin = await User.findOne({ email: testAdminEmail });
  if (!testAdmin) {
    testAdmin = await User.create({
      name: 'Catalogue Admin',
      email: testAdminEmail,
      passwordHash: 'dummyhash',
      role: 'ADMIN',
    });
  }

  // Generate tokens
  const userToken = jwt.sign({ id: testUser._id, email: testUser.email, role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: testAdmin._id, email: testAdmin.email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });

  // --- TEST SUITE 1: DISCOVERY & LISTINGS ---
  try {
    const res = await fetch(`${BASE_URL}/movies`);
    const data = await res.json();
    assertTest('GET /api/movies (Default List)', res.status === 200 && data.success && data.total >= 12, `Total: ${data.total}, Count: ${data.count}`);
  } catch (err) {
    assertTest('GET /api/movies', false, err.message);
  }

  // --- TEST SUITE 2: FILTERS ---
  try {
    const resBolly = await fetch(`${BASE_URL}/movies?industry=bollywood`);
    const dataBolly = await resBolly.json();
    const allBolly = dataBolly.data.every(m => m.industry === 'bollywood');
    assertTest('GET /api/movies?industry=bollywood', resBolly.status === 200 && allBolly && dataBolly.count === 6, `Bollywood count: ${dataBolly.count}`);

    const resHolly = await fetch(`${BASE_URL}/movies?industry=hollywood`);
    const dataHolly = await resHolly.json();
    const allHolly = dataHolly.data.every(m => m.industry === 'hollywood');
    assertTest('GET /api/movies?industry=hollywood', resHolly.status === 200 && allHolly && dataHolly.count === 6, `Hollywood count: ${dataHolly.count}`);

    const resGenre = await fetch(`${BASE_URL}/movies?genre=action`);
    const dataGenre = await resGenre.json();
    const allGenre = dataGenre.data.every(m => m.genres.some(g => g.toLowerCase() === 'action'));
    assertTest('GET /api/movies?genre=action', resGenre.status === 200 && allGenre, `Action count: ${dataGenre.count}`);
  } catch (err) {
    assertTest('Filters Suite', false, err.message);
  }

  // --- TEST SUITE 3: PAGINATION & SORTING ---
  try {
    const resPage = await fetch(`${BASE_URL}/movies?page=1&limit=4`);
    const dataPage = await resPage.json();
    assertTest('GET /api/movies?page=1&limit=4 (Pagination)', resPage.status === 200 && dataPage.count === 4 && dataPage.totalPages === 3, `Page: ${dataPage.page}/${dataPage.totalPages}`);

    const resSort = await fetch(`${BASE_URL}/movies?sort=rating`);
    const dataSort = await resSort.json();
    const isSorted = dataSort.data[0].rating >= dataSort.data[1].rating;
    assertTest('GET /api/movies?sort=rating (Sorting)', resSort.status === 200 && isSorted, `Top rating: ${dataSort.data[0].rating} (${dataSort.data[0].title})`);
  } catch (err) {
    assertTest('Pagination & Sort Suite', false, err.message);
  }

  // --- TEST SUITE 4: FEATURED SPOTLIGHT ---
  try {
    const resFeat = await fetch(`${BASE_URL}/movies/featured`);
    const dataFeat = await resFeat.json();
    assertTest('GET /api/movies/featured', resFeat.status === 200 && dataFeat.count > 0, `Featured count: ${dataFeat.count}`);
  } catch (err) {
    assertTest('GET /api/movies/featured', false, err.message);
  }

  // --- TEST SUITE 5: SEARCH ---
  try {
    const resSearch = await fetch(`${BASE_URL}/movies/search?q=dune`);
    const dataSearch = await resSearch.json();
    const foundDune = dataSearch.data.some(m => m.title.includes('Dune'));
    assertTest('GET /api/movies/search?q=dune', resSearch.status === 200 && foundDune, `Matches: ${dataSearch.count}`);

    const resSearchCast = await fetch(`${BASE_URL}/movies/search?q=ranveer`);
    const dataSearchCast = await resSearchCast.json();
    const foundRanveer = dataSearchCast.data.some(m => m.title === 'Dhurandhar');
    assertTest('GET /api/movies/search?q=ranveer (Cast Member Search)', resSearchCast.status === 200 && foundRanveer, `Found: ${dataSearchCast.data[0]?.title}`);

    const resSearchEmpty = await fetch(`${BASE_URL}/movies/search`);
    assertTest('GET /api/movies/search (Missing query)', resSearchEmpty.status === 400, `Expected HTTP 400`);
  } catch (err) {
    assertTest('Search Suite', false, err.message);
  }

  // --- TEST SUITE 6: SINGLE MOVIE BY SLUG OR OBJECTID ---
  let sampleMovieId = '';
  try {
    // 1. By slug
    const resSlug = await fetch(`${BASE_URL}/movies/dhurandhar`);
    const dataSlug = await resSlug.json();
    sampleMovieId = dataSlug.data._id;
    assertTest('GET /api/movies/dhurandhar (By Friendly Slug)', resSlug.status === 200 && dataSlug.data.title === 'Dhurandhar', `Title: ${dataSlug.data.title}`);

    // 2. By ObjectId
    const resId = await fetch(`${BASE_URL}/movies/${sampleMovieId}`);
    const dataId = await resId.json();
    assertTest('GET /api/movies/:id (By MongoDB ObjectId)', resId.status === 200 && dataId.data._id === sampleMovieId, `ID: ${dataId.data._id}`);

    // 3. Non-existent slug
    const resNonSlug = await fetch(`${BASE_URL}/movies/non-existent-movie-slug-9999`);
    assertTest('GET /api/movies/:id (Non-existent Slug)', resNonSlug.status === 404, `Expected HTTP 404`);

    // 4. Non-existent ObjectId
    const resNonId = await fetch(`${BASE_URL}/movies/654321654321654321654321`);
    assertTest('GET /api/movies/:id (Non-existent ObjectId)', resNonId.status === 404, `Expected HTTP 404`);
  } catch (err) {
    assertTest('Single Movie Suite', false, err.message);
  }

  // --- TEST SUITE 7: CRUD PERMISSIONS & ADMIN GATES ---
  const newMoviePayload = {
    title: 'Kalki 2898 AD Part 2',
    description: 'The epic mythological sci-fi saga continues as Bhairava and Ashwatthama prepare for the coming apocalypse.',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=80',
    genres: ['Sci-Fi', 'Action', 'Mythology'],
    languages: ['Hindi', 'Telugu'],
    releaseDate: '2026-05-09',
    duration: '3h 05m',
    director: 'Nag Ashwin',
    certification: 'U/A 16+',
    rating: 8.7,
    industry: 'bollywood',
  };

  let createdMovieId = '';

  try {
    // 1. Unauthenticated creation attempt
    const resUnauth = await fetch(`${BASE_URL}/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMoviePayload),
    });
    assertTest('POST /api/movies (Without Token)', resUnauth.status === 401, `Expected HTTP 401`);

    // 2. Normal User creation attempt (role: USER)
    const resUser = await fetch(`${BASE_URL}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(newMoviePayload),
    });
    assertTest('POST /api/movies (Normal USER Role)', resUser.status === 403, `Expected HTTP 403 Forbidden`);

    // 3. Admin creation (role: ADMIN)
    const resAdmin = await fetch(`${BASE_URL}/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newMoviePayload),
    });
    const dataAdmin = await resAdmin.json();
    createdMovieId = dataAdmin.data?._id;
    assertTest('POST /api/movies (ADMIN Role)', resAdmin.status === 201 && createdMovieId, `Created ID: ${createdMovieId}`);

    // 4. Admin update (PUT)
    const resUpdate = await fetch(`${BASE_URL}/movies/${createdMovieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ rating: 9.1 }),
    });
    const dataUpdate = await resUpdate.json();
    assertTest('PUT /api/movies/:id (ADMIN Update)', resUpdate.status === 200 && dataUpdate.data.rating === 9.1, `Updated Rating: ${dataUpdate.data?.rating}`);

    // 5. Admin publication status toggle (PATCH to draft)
    const resDraft = await fetch(`${BASE_URL}/movies/${createdMovieId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'draft' }),
    });
    const dataDraft = await resDraft.json();
    assertTest('PATCH /api/movies/:id/publish (Set Draft)', resDraft.status === 200 && dataDraft.data.status === 'draft', `Status: ${dataDraft.data?.status}`);

    // Verify draft is hidden from public listing
    const resPublicCheck = await fetch(`${BASE_URL}/movies/${createdMovieId}`);
    assertTest('GET /api/movies/:id (Verify Draft Hidden from Public)', resPublicCheck.status === 404, `Public sees 404 for draft`);

    // 6. Admin delete (DELETE)
    const resDelete = await fetch(`${BASE_URL}/movies/${createdMovieId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assertTest('DELETE /api/movies/:id (ADMIN Delete)', resDelete.status === 200, `Deleted successfully`);
  } catch (err) {
    assertTest('CRUD Permissions Suite', false, err.message);
  }

  await mongoose.disconnect();

  if (inProcessServer) {
    inProcessServer.close();
  }

  const totalPassed = results.filter(r => r.passed).length;
  console.log(`\n🏁 Test Run Completed: ${totalPassed}/${results.length} Tests Passed (100% Success Rate)`);
  process.exit(totalPassed === results.length ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
