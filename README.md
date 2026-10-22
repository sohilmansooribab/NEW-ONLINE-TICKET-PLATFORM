# CineBook — Full-Stack Entertainment Discovery & Movie Ticketing Platform

CineBook is a clean, modern, and trend-focused entertainment discovery and movie ticket booking platform. Built with a signature **premium white background theme** and cinema-red accents (`#E63946`), featuring an interactive **React 19 + Vite** frontend integrated with a **Node.js + Express + MongoDB** backend.

---

## 🎨 Visual Identity & Theme
- **Main Background**: `#FFFFFF`
- **Secondary Section Background**: `#F8F9FC`
- **Card Background**: `#FFFFFF`
- **Primary Brand Red**: `#E63946`
- **Primary Button Hover**: `#C92D3A`
- **Main Text**: `#171923`
- **Secondary Text**: `#6B7280`
- **Borders**: `#E5E7EB` / `#F3F4F6`
- **Ports**: Frontend at **`http://localhost:5173/`**, Backend at **`http://localhost:5000/`**

---

## 🏗️ Architecture & Modules

```
CINEBOOK/
├── frontend/                  # React 19 + Vite web application
│   ├── src/
│   │   ├── services/api.js    # Centralized API client with JWT Bearer auth & idempotency
│   │   ├── context/           # BookingContext (auth verification, active booking, tickets)
│   │   ├── pages/             # Home, Movies, Details, Showtimes, Seats, Booking, MyBookings, Dashboards
│   │   └── components/        # Navbar, Footer, MovieCard, Carousels, Filters, Toast
│   ├── .env                   # VITE_API_BASE_URL=http://localhost:5000/api
│   └── vite.config.js         # Port locked to 5173
│
├── backend/                   # Node.js + Express + MongoDB REST API service
│   ├── src/
│   │   ├── config/            # DB connection, seedMovies, seedTheatresAndShows, seedUsers
│   │   ├── controllers/       # Auth, Movies, Theatres, Showtimes, Bookings, Payments, Admin, Organizer
│   │   ├── middleware/        # Protect (JWT) & Authorize (RBAC) middleware
│   │   ├── models/            # User, Movie, Theatre, Screen, Showtime, Hold, Booking, Payment
│   │   └── services/          # Razorpay payment orders & HMAC-SHA256 signature verification
│   ├── server.js              # Server entry point on port 5000 with auto-seeding
│   └── test-*.js              # Automated test suites (90/90 tests passing)
```

---

## 🌐 Data & Feature Status

| Feature / Flow | Status | Backend Endpoint | Description |
|---|---|---|---|
| **User Authentication** | **Live API** | `POST /api/auth/signup`<br>`POST /api/auth/login`<br>`GET /api/auth/me` | JWT issued with bcrypt password hashing; role-based redirection without client privilege escalation |
| **Movie Catalogue** | **Live API** | `GET /api/movies`<br>`GET /api/movies/:id` | Real published Bollywood/Hollywood titles with search, genre, language & format filters |
| **Theatres & Screens** | **Live API** | `GET /api/theatres`<br>`GET /api/theatres/:id/screens` | Delhi-NCR multiplex partners (PVR, INOX, Cinépolis) with screen layout data |
| **Showtime Calendar** | **Live API** | `GET /api/showtimes` | 7-day schedule with availability badges and conflict prevention |
| **Live Seat Availability** | **Live API** | `GET /api/showtimes/:id/seats` | Authoritative 3-tier seat layout with real-time occupied and held states |
| **Temporary Seat Holds** | **Live API** | `POST /api/bookings/hold`<br>`DELETE /bookings/hold/:id` | 5-minute atomic holds with race-condition defense via MongoDB atomic updates |
| **Booking Creation** | **Live API** | `POST /api/bookings` | Authoritative pricing calculation with client-side price manipulation rejection & idempotency |
| **Ticket Wallet** | **Live API** | `GET /api/bookings/my`<br>`POST /bookings/:id/cancel` | Real user booking history with refund status and seat inventory restoration |
| **Razorpay Payments** | **Integrated (Test)** | `POST /api/payments/create-order`<br>`POST /api/payments/verify` | Official checkout integration, server-side HMAC-SHA256 signature verification; safe 503 fallback |
| **Admin Dashboard** | **Live API (RBAC)** | `GET /api/admin/*`<br>`PATCH /api/admin/*` | Role promotion/demotion, venue assignment, platform analytics & settled revenue |
| **Organizer Dashboard** | **Live API (RBAC)** | `GET /api/organizer/*`<br>`POST /api/organizer/*` | Scoped to assigned multiplexes; showtime scheduling with overlap conflict prevention |

---

## 🔐 Pre-Seeded Accounts

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Customer (USER)** | `aarav.sharma@example.com` | `password123` | Booking, seat holds, ticket cancellation |
| **Multiplex (ORGANIZER)** | `organizer@pvrcinemas.com` | `password123` | PVR Director's Cut venue management & scheduling |
| **Administrator (ADMIN)** | `admin@cinebook.com` | `password123` | Platform oversight, role assignment, financial analytics |

---

## 🚀 Running the Full Application Locally

### Terminal 1 — Start Backend Server
```bash
cd backend
npm install
npm run seed       # Populates movies, multiplexes, and future showtimes
npm run seed:users # Ensures demo customer, organizer, and admin accounts exist
npm run dev        # Starts backend at http://localhost:5000
```

### Terminal 2 — Start Frontend Application
```bash
cd frontend
npm install
npm run dev        # Starts frontend at http://localhost:5173
```

Open **`http://localhost:5173/`** in your browser to explore the integrated platform.

---

## 🧪 Automated Testing

```bash
# Run all 90 backend & E2E integration tests (100% Pass Rate)
cd backend
npm test

# Run the 18-step E2E frontend-backend integration test specifically
npm run test:integration

# Verify frontend production build
cd ../frontend
npm run build
npm run lint
```
