# CineBook — Frontend Web Application

Modern, trend-focused entertainment discovery and movie ticket booking frontend built with **React 19**, **Vite**, and **Vanilla CSS**. Features a signature **premium white background theme** with cinema-red accents (`#E63946`), fully integrated with the CineBook Node.js/Express/MongoDB backend API.

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
- **Port**: Strictly running on **`http://localhost:5173/`**

---

## ⚙️ Environment Configuration

Frontend environment variables are configured in `frontend/.env` (template in `frontend/.env.example`):

```bash
# Centralized API Base URL for backend communications
VITE_API_BASE_URL=http://localhost:5000/api

# Optional: TMDB API Key for live Hollywood/Bollywood poster trends
# VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

> [!IMPORTANT]
> Never expose MongoDB database URIs, JWT signing secrets, or payment gateway private secret keys in `VITE_` frontend environment variables. Sensitive operations are executed strictly server-side.

---

## 🔌 API Client Architecture

The centralized API client is located at `frontend/src/services/api.js`:
- **Base Client (`request`)**: Automatically injects JWT Bearer tokens from `localStorage` into `Authorization` headers.
- **Error Handling**: Gracefully handles network failures, validation errors (400), unauthorized access (401/403), seat hold conflicts (409), and gateway unconfigured status (503).
- **Idempotency Protection**: Injects unique UUIDv4 idempotency keys (`Idempotency-Key`) for booking creation and financial operations to eliminate duplicate charges.

### Integrated Services

| Module | Endpoints Integrated | Purpose |
|---|---|---|
| **Auth (`authApi`)** | `POST /auth/signup`<br>`POST /auth/login`<br>`GET /auth/me` | User registration, session verification, and role-based redirect |
| **Movies (`moviesApi`)** | `GET /movies`<br>`GET /movies/:id`<br>`GET /movies/featured`<br>`GET /movies/search` | Dynamic catalogues, multi-filter search, genre and language filtering |
| **Theatres (`theatresApi`)** | `GET /theatres`<br>`GET /theatres/:id`<br>`GET /theatres/:id/screens` | Venue directory, screen layouts, city-based filtering |
| **Showtimes (`showtimesApi`)** | `GET /showtimes`<br>`GET /showtimes/:id`<br>`GET /showtimes/:id/seats` | Calendar showtimes, live seat maps, tiered pricing, and availability states |
| **Bookings (`bookingsApi`)** | `POST /bookings/hold`<br>`DELETE /bookings/hold/:holdId`<br>`POST /bookings`<br>`GET /bookings/my`<br>`GET /bookings/:id`<br>`POST /bookings/:id/cancel` | Concurrency-safe seat reservation, 5-minute seat hold, booking creation, cancellation |
| **Payments (`paymentsApi`)** | `POST /payments/create-order`<br>`POST /payments/verify`<br>`POST /bookings/:id/confirm-payment` | Razorpay order generation, HMAC signature verification, test mode fallback |
| **Admin (`adminApi`)** | `GET /admin/users`<br>`PATCH /admin/users/:id/role`<br>`DELETE /admin/users/:id`<br>`PATCH /admin/theatres/:id/assign-organizer`<br>`GET /admin/bookings`<br>`GET /admin/analytics` | Superadmin controls, role promotion/demotion, venue assignment, platform analytics |
| **Organizer (`organizerApi`)** | `GET /organizer/theatres`<br>`POST /organizer/showtimes`<br>`PUT /organizer/showtimes/:id`<br>`DELETE /organizer/showtimes/:id`<br>`GET /organizer/bookings`<br>`GET /organizer/analytics` | Partner dashboard, scoped venue showtime scheduling, conflict prevention, venue revenue |

---

## 🔐 Demo Credentials

Quick-fill demo buttons are provided on the Login page (`/login`):

| Role | Email | Password | Permissions |
|---|---|---|---|
| **User (Customer)** | `aarav.sharma@example.com` | `password123` | Browse catalogue, hold seats, book tickets, cancel reservations |
| **Organizer (Multiplex)** | `organizer@pvrcinemas.com` | `password123` | Manage assigned theatres (*PVR Director's Cut*), schedule showtimes |
| **Administrator** | `admin@cinebook.com` | `password123` | Platform oversight, assign organizers, role updates, revenue analytics |

---

## 🚀 Running Frontend Locally

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL=http://localhost:5000/api` is set.

### 3. Start Vite Dev Server
```bash
npm run dev
```
> The application will start at **`http://localhost:5173/`**.

### 4. Build for Production
```bash
npm run build
```

### 5. Lint Checks
```bash
npm run lint
```

---

## 🛡️ Fallback & Resilience Strategy

- **Live Backend First**: All pages prioritize real MongoDB backend data.
- **Graceful Fallbacks**: If the backend is temporarily offline, movies and layout previews gracefully switch to curated local templates with clear status indicators rather than crashing.
- **Payment Gateway Fallback**: If Razorpay live/test keys are not yet configured on the backend, the booking summary displays a clear advisory banner and offers an authoritative test confirmation workflow (`POST /bookings/:id/confirm-payment`) so reservations can be tested end-to-end.
