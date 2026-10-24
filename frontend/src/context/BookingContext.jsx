import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOVIES, THEATRES, INITIAL_BOOKINGS, PROMO_CODES } from '../data/mockData';
import { authApi, bookingsApi } from '../services/api';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  // City selection
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('cinebook_city') || 'delhi';
  });

  // Global search query
  const [searchQuery, setSearchQuery] = useState('');

  // User state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cinebook_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);

  // Bookings list (backed by real API with fallback)
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('cinebook_bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  // Active booking in-progress
  const [activeBooking, setActiveBooking] = useState({
    movie: MOVIES[0],
    theatre: THEATRES[0],
    screen: THEATRES[0].screens?.[0] || { name: 'Audi 1', format: 'IMAX Laser' },
    showtime: null,
    date: 'Fri, 24 Oct 2026',
    time: '06:15 PM',
    format: 'IMAX 3D',
    selectedSeats: [], // [{ id: 'F7', seatId: 'F7', row: 'F', col: 7, tier: 'Premium', price: 320 }]
    appliedPromo: null,
    hold: null, // { holdId, expiresAt, expiresInSeconds }
    authoritativePricing: null,
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4200);
  }, []);

  // Save selected city
  useEffect(() => {
    localStorage.setItem('cinebook_city', selectedCity);
  }, [selectedCity]);

  // Sync bookings cache
  useEffect(() => {
    localStorage.setItem('cinebook_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Verify stored session with backend on load
  useEffect(() => {
    const token = localStorage.getItem('cinebook_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('cinebook_user', JSON.stringify(res.user));
        }
      })
      .catch((err) => {
        console.warn('Session verification notice:', err.message);
        // If 401, token is invalid or expired
        if (err.status === 401) {
          localStorage.removeItem('cinebook_token');
          localStorage.removeItem('cinebook_user');
          setCurrentUser(null);
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Refresh customer's bookings from backend
  const refreshBookings = useCallback(async () => {
    const token = localStorage.getItem('cinebook_token');
    if (!token) return;

    try {
      const res = await bookingsApi.getMyBookings();
      if (res && res.bookings) {
        // Normalize backend booking objects for UI compatibility
        const normalized = res.bookings.map((b) => ({
          id: b.bookingReference || b.id || b._id,
          _id: b._id || b.id,
          bookingReference: b.bookingReference,
          movieId: b.showtime?.movie?._id || b.showtime?.movie?.slug || 'movie',
          movieTitle: b.showtime?.movie?.title || 'Movie',
          moviePoster: b.showtime?.movie?.poster || '/images/bollywood/dhurandhar.png',
          certificate: b.showtime?.movie?.certification || 'U/A',
          format: b.showtime?.format || 'IMAX Laser',
          language: b.showtime?.movie?.languages?.[0] || 'Hindi',
          theatreName: b.showtime?.theatre?.name || 'Multiplex Venue',
          theatreLocation: b.showtime?.theatre?.location || 'Cinema Hall',
          screenName: b.showtime?.screen?.name || 'Screen 1',
          date: b.showtime?.startTime ? new Date(b.showtime.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
          time: b.showtime?.startTime ? new Date(b.showtime.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '06:00 PM',
          seats: b.seats || [],
          seatTier: b.seats?.[0] ? 'Reserved' : 'Standard',
          ticketCount: b.ticketCount || (b.seats ? b.seats.length : 1),
          baseAmount: b.pricing?.baseAmount || 0,
          convenienceFee: b.pricing?.convenienceFee || 0,
          discountAmount: b.pricing?.discountAmount || 0,
          totalAmount: b.pricing?.totalAmount || 0,
          bookingDate: b.createdAt || new Date().toISOString(),
          status: b.status === 'confirmed' ? 'CONFIRMED' : b.status === 'cancelled' ? 'CANCELLED' : b.status?.toUpperCase() || 'PENDING',
          paymentStatus: b.paymentStatus,
          customerName: b.contactDetails?.name || '',
          customerEmail: b.contactDetails?.email || '',
          customerPhone: b.contactDetails?.phone || '',
          qrCode: b.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${b.bookingReference}`,
        }));
        setBookings(normalized);
      }
    } catch (err) {
      console.warn('Could not fetch remote bookings, relying on local state:', err.message);
    }
  }, []);

  // Fetch bookings when user logs in
  useEffect(() => {
    if (currentUser) {
      refreshBookings();
    }
  }, [currentUser, refreshBookings]);

  // Real backend login handler
  const login = async (credentials) => {
    // If credentials is an object with email & password, call real API
    if (credentials?.email && credentials?.password) {
      const res = await authApi.login({
        email: credentials.email,
        password: credentials.password,
      });

      if (res?.token && res?.user) {
        localStorage.setItem('cinebook_token', res.token);
        localStorage.setItem('cinebook_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        showToast(`Welcome back, ${res.user.name}!`);
        return res.user;
      }
      throw new Error(res?.message || 'Login failed');
    }

    // Direct user object fallback (for compatibility)
    if (credentials?.role) {
      setCurrentUser(credentials);
      localStorage.setItem('cinebook_user', JSON.stringify(credentials));
      showToast(`Welcome back, ${credentials.name}!`);
      return credentials;
    }
  };

  // Real backend signup handler
  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    if (res?.token && res?.user) {
      localStorage.setItem('cinebook_token', res.token);
      localStorage.setItem('cinebook_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      showToast(`Welcome to CineBook, ${res.user.name}!`);
      return res.user;
    }
    throw new Error(res?.message || 'Signup failed');
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('cinebook_token');
    localStorage.removeItem('cinebook_user');
    setCurrentUser(null);
    showToast('You have been logged out.');
  };

  // Start booking flow for a specific movie & showtime
  const startBooking = (movie, theatre = null, date = null, time = null, format = null, showtime = null) => {
    const defaultTheatre = theatre || THEATRES[0];
    const defaultScreen = defaultTheatre?.screens?.[0] || { name: 'Audi 1', format: 'IMAX Laser' };
    const defaultTime = time || (defaultScreen?.showtimes?.[0] ? defaultScreen.showtimes[0].time : '06:15 PM');
    const defaultFormat = format || defaultScreen?.format || 'IMAX 3D';

    setActiveBooking({
      movie: movie || MOVIES[0],
      theatre: defaultTheatre,
      screen: defaultScreen,
      showtime: showtime || null,
      date: date || 'Fri, 24 Oct 2026',
      time: defaultTime,
      format: defaultFormat,
      selectedSeats: [],
      appliedPromo: null,
      hold: null,
      authoritativePricing: null,
    });
  };

  // Update parts of active booking
  const updateBookingState = (updates) => {
    setActiveBooking((prev) => ({ ...prev, ...updates }));
  };

  // Seat toggle helper
  const toggleSeat = (seat) => {
    const seatId = seat.id || seat.seatId;
    setActiveBooking((prev) => {
      const exists = prev.selectedSeats.some((s) => (s.id || s.seatId) === seatId);
      let newSeats;
      if (exists) {
        newSeats = prev.selectedSeats.filter((s) => (s.id || s.seatId) !== seatId);
      } else {
        if (prev.selectedSeats.length >= 8) {
          showToast('Maximum 8 tickets allowed per booking.', 'warning');
          return prev;
        }
        newSeats = [...prev.selectedSeats, { ...seat, id: seatId, seatId }];
      }
      return { ...prev, selectedSeats: newSeats, hold: null, authoritativePricing: null };
    });
  };

  // Apply promo code
  const applyPromo = (codeStr) => {
    const found = PROMO_CODES.find((p) => p.code.toLowerCase() === codeStr.trim().toLowerCase());
    if (found) {
      setActiveBooking((prev) => ({ ...prev, appliedPromo: found }));
      showToast(`Promo applied! ${found.description}`);
      return { success: true, promo: found };
    } else {
      showToast('Invalid promo code. Try CINEPASS20', 'error');
      return { success: false, message: 'Invalid promo code' };
    }
  };

  const removePromo = () => {
    setActiveBooking((prev) => ({ ...prev, appliedPromo: null }));
    showToast('Promo code removed.');
  };

  // Authoritative price calculations
  const calculatePricing = () => {
    // If backend hold pricing is already present, use it exclusively
    if (activeBooking.authoritativePricing) {
      return {
        ticketCount: activeBooking.selectedSeats.length,
        baseTotal: activeBooking.authoritativePricing.baseAmount,
        convenienceFee: activeBooking.authoritativePricing.convenienceFee,
        discount: activeBooking.authoritativePricing.discountAmount || 0,
        totalAmount: activeBooking.authoritativePricing.totalAmount,
      };
    }

    const seats = activeBooking.selectedSeats;
    const baseTotal = seats.reduce((acc, s) => acc + (s.price || 300), 0);
    const convenienceFee = seats.length > 0 ? Math.round(baseTotal * 0.12) : 0;

    let discount = 0;
    if (activeBooking.appliedPromo) {
      if (activeBooking.appliedPromo.discountPercent) {
        discount = Math.round((baseTotal * activeBooking.appliedPromo.discountPercent) / 100);
        if (discount > 150) discount = 150; // Max cap
      } else if (activeBooking.appliedPromo.discountFlat) {
        discount = activeBooking.appliedPromo.discountFlat;
      }
    }

    const totalAmount = Math.max(0, baseTotal + convenienceFee - discount);

    return {
      ticketCount: seats.length,
      baseTotal,
      convenienceFee,
      discount,
      totalAmount,
    };
  };

  // Finalize booking locally if offline or legacy
  const confirmBooking = (contactDetails = {}) => {
    const pricing = calculatePricing();
    const newId = `CNB-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBookingRecord = {
      id: newId,
      bookingReference: newId,
      movieId: activeBooking.movie?.id || 'dune-2',
      movieTitle: activeBooking.movie?.title || 'Dune: Part Two',
      moviePoster: activeBooking.movie?.poster,
      certificate: activeBooking.movie?.certificate || activeBooking.movie?.certification || 'U/A',
      format: activeBooking.format,
      language: activeBooking.movie?.languages?.[0] || 'Hindi',
      theatreName: activeBooking.theatre?.name || "PVR Director's Cut",
      theatreLocation: activeBooking.theatre?.location || 'Vasant Kunj, Delhi',
      screenName: activeBooking.screen?.name || 'Screen 1',
      date: activeBooking.date,
      time: activeBooking.time,
      seats: activeBooking.selectedSeats.map((s) => s.id || s.seatId),
      seatTier: activeBooking.selectedSeats[0]?.tier || 'Standard',
      ticketCount: activeBooking.selectedSeats.length,
      baseAmount: pricing.baseTotal,
      convenienceFee: pricing.convenienceFee,
      discountAmount: pricing.discount,
      totalAmount: pricing.totalAmount,
      bookingDate: new Date().toISOString(),
      status: 'CONFIRMED',
      customerName: contactDetails.name || currentUser?.name || 'Guest User',
      customerEmail: contactDetails.email || currentUser?.email || 'guest@example.com',
      customerPhone: contactDetails.phone || '+91 98765 43210',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${newId}`,
    };

    setBookings((prev) => [newBookingRecord, ...prev]);
    showToast(`Booking ${newId} confirmed successfully!`);
    return newBookingRecord;
  };

  // Cancel booking through backend API
  const cancelBooking = async (id, reason = 'User requested cancellation') => {
    try {
      // Find booking record to get MongoDB ID if available
      const found = bookings.find((b) => b.id === id || b.bookingReference === id || b._id === id);
      const targetId = found?._id || found?.bookingReference || id;

      await bookingsApi.cancelBooking(targetId, reason);
      showToast(`Booking ${id} has been cancelled.`);
      await refreshBookings();
    } catch (err) {
      console.warn('Remote cancel fallback to local state:', err.message);
      setBookings((prev) =>
        prev.map((b) => (b.id === id || b.bookingReference === id ? { ...b, status: 'CANCELLED' } : b))
      );
      showToast(`Booking ${id} has been cancelled.`);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        searchQuery,
        setSearchQuery,
        currentUser,
        authLoading,
        login,
        signup,
        logout,
        activeBooking,
        startBooking,
        updateBookingState,
        toggleSeat,
        applyPromo,
        removePromo,
        calculatePricing,
        confirmBooking,
        bookings,
        cancelBooking,
        refreshBookings,
        toast,
        showToast,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
