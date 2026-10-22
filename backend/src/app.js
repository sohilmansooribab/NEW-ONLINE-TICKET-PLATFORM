import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import movieRoutes from './routes/movie.routes.js';
import theatreRoutes from './routes/theatre.routes.js';
import showtimeRoutes from './routes/showtime.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import organizerRoutes from './routes/organizer.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.includes('localhost:5173'))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body Parsers (JSON with rawBody capture for webhook signature verification, and URL-encoded)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Root info route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'CineBook API Service',
    version: '1.0.0',
    documentation: 'See GET /api/health for system status',
    endpoints: {
      health: '/api/health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      movies: {
        list: 'GET /api/movies',
        featured: 'GET /api/movies/featured',
        search: 'GET /api/movies/search?q=:query',
        details: 'GET /api/movies/:id',
        create: 'POST /api/movies (ADMIN)',
        update: 'PUT /api/movies/:id (ADMIN)',
        publish: 'PATCH /api/movies/:id/publish (ADMIN)',
        delete: 'DELETE /api/movies/:id (ADMIN)',
      },
      theatres: {
        list: 'GET /api/theatres',
        details: 'GET /api/theatres/:id',
        screens: 'GET /api/theatres/:id/screens',
        create: 'POST /api/theatres (ADMIN)',
        update: 'PUT /api/theatres/:id (ADMIN)',
        delete: 'DELETE /api/theatres/:id (ADMIN)',
        createScreen: 'POST /api/theatres/:id/screens (ADMIN)',
        updateScreen: 'PUT /api/theatres/screens/:id (ADMIN)',
        deleteScreen: 'DELETE /api/theatres/screens/:id (ADMIN)',
      },
      showtimes: {
        list: 'GET /api/showtimes',
        details: 'GET /api/showtimes/:id',
        seats: 'GET /api/showtimes/:id/seats',
        create: 'POST /api/showtimes (ADMIN)',
        update: 'PUT /api/showtimes/:id (ADMIN)',
        delete: 'DELETE /api/showtimes/:id (ADMIN)',
      },
      bookings: {
        hold: 'POST /api/bookings/hold',
        releaseHold: 'DELETE /api/bookings/hold/:holdId',
        create: 'POST /api/bookings',
        my: 'GET /api/bookings/my',
        details: 'GET /api/bookings/:id',
        status: 'GET /api/bookings/:id/status',
        confirmPayment: 'POST /api/bookings/:id/confirm-payment',
        cancel: 'POST /api/bookings/:id/cancel',
      },
      payments: {
        createOrder: 'POST /api/payments/create-order',
        verify: 'POST /api/payments/verify',
        webhook: 'POST /api/payments/webhook',
      },
      admin: {
        users: 'GET /api/admin/users (ADMIN)',
        userDetails: 'GET /api/admin/users/:id (ADMIN)',
        updateRole: 'PUT /api/admin/users/:id/role (ADMIN)',
        deleteUser: 'DELETE /api/admin/users/:id (ADMIN)',
        assignOrganizer: 'PUT /api/admin/theatres/:id/assign-organizer (ADMIN)',
        bookings: 'GET /api/admin/bookings (ADMIN)',
        analytics: 'GET /api/admin/analytics (ADMIN)',
      },
      organizer: {
        profile: 'GET /api/organizer/profile (ORGANIZER)',
        theatres: 'GET /api/organizer/theatres (ORGANIZER)',
        showtimes: 'GET /api/organizer/showtimes (ORGANIZER)',
        createShowtime: 'POST /api/organizer/showtimes (ORGANIZER)',
        updateShowtime: 'PUT /api/organizer/showtimes/:id (ORGANIZER)',
        deleteShowtime: 'DELETE /api/organizer/showtimes/:id (ORGANIZER)',
        bookings: 'GET /api/organizer/bookings (ORGANIZER)',
        analytics: 'GET /api/organizer/analytics (ORGANIZER)',
      },
    },
  });
});

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizer', organizerRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
