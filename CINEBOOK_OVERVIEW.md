# CineBook — Premium Movie Ticket Booking Website (White Theme)

CineBook is a world-class, modern movie ticket booking platform built with React, Vite, React Router, and Lucide React. Designed with a **premium white background theme**, it combines the usability of BookMyShow with an elegant, modern visual identity.

---

## 🎨 Visual Identity & Theme
- **Main Background**: `#FFFFFF`
- **Secondary Background**: `#F8F9FC`
- **Card Background**: `#FFFFFF`
- **Primary Brand Red**: `#E63946`
- **Primary Button Hover**: `#C92D3A`
- **Primary Text**: `#171923`
- **Secondary Text**: `#6B7280`
- **Subtle Borders**: `#E5E7EB` / `#F3F4F6`
- **Subtle Shadows**: Minimal, clean, and soft
- **Typography**: Google Fonts Outfit (Display/Headings) & Inter (UI/Body)

---

## 🚀 Running the Project

The Vite development server is currently live at:
**http://localhost:5173/**

To run locally anytime:
```bash
npm install
npm run dev
```

To build for production:
```bash
npm run build
```

---

## 📱 Pages & Navigation Routes

| Page | Route | Description |
|---|---|---|
| **Home** | `/` | White-themed hero carousel, trending movies, now showing with genre filter, light CinePass promo banner, multiplexes in Delhi-NCR, upcoming releases, footer |
| **Movies Listing** | `/movies` | Search by title/actor/director, filter by genre, language, and format, sort by rating/popularity |
| **Movie Details** | `/movie/:id` | Clean white layout, rating badges, cast & crew grid, synopsis, trailer video modal, quick showtimes preview |
| **Select Showtimes** | `/theatres/:movieId` | 7-day date selector, experience filters (IMAX 3D, 4DX, 2D), multiplex cards with amenities, color-coded showtimes |
| **Seat Selection** | `/select-seats/:theatreId` | Curved screen indicator ("ALL EYES THIS WAY"), tiered seat layout (VIP Recliner, Premium, Classic), live dynamic price calculation |
| **Booking Summary** | `/booking-summary` | Movie & theatre review, selected seats, contact form, demo payment selector (UPI, Card, CineWallet), promo code support (`CINEPASS20`), instant confirmation modal with QR code |
| **My Bookings** | `/my-bookings` | Upcoming & past booking tabs, white perforated cinema tickets, QR entry passes, printable e-ticket modal, cancel booking action |
| **Login** | `/login` | Modern form with validation, password visibility toggle, one-click demo role fillers |
| **Signup** | `/signup` | Account creation with validation, terms checkbox, matching aesthetic |
| **Organizer Portal** | `/organizer` | Box office KPIs, weekly revenue bar chart, showtime schedule table with live occupancy bars, "Schedule New Showtime" modal |
| **Admin Control** | `/admin` | Platform gross revenue, regional box office share bars, theatre verification approvals, user accounts management |

---

## 🎟️ Demo Testing Credentials & Promos

### Quick Promo Codes
- `CINEPASS20` — 20% off on all IMAX/4DX tickets (up to ₹150)
- `IMAX50` — Flat ₹50 off
- `WELCOME100` — ₹100 off on first booking

### One-Click Demo Auth (available on `/login`)
- **Moviegoer**: `aarav.sharma@example.com` / `password123`
- **Cinema Partner (Organizer)**: `organizer@pvr-cinemas.com` / `cinemaPass2026`
- **Superadmin**: `admin@cinebook.com` / `masterAdmin2026`
