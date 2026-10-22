/**
 * CineBook Frontend Centralized API Client
 * Connects React UI to the Express/MongoDB Backend Service.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Base HTTP request wrapper with Bearer token authentication and error normalization.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach token if present
  const token = localStorage.getItem('cinebook_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach idempotency key if provided
  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    const error = new Error(`Cannot connect to CineBook server at ${API_BASE_URL}. Ensure the backend is running.`);
    error.isNetworkError = true;
    error.status = 0;
    throw error;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.message) || `Server error (${response.status}): ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code;
    error.data = data;

    // Handle token expiry / invalidation
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
      localStorage.removeItem('cinebook_token');
      localStorage.removeItem('cinebook_user');
      window.dispatchEvent(new Event('cinebook:auth_expired'));
    }

    throw error;
  }

  return data;
}

// ----------------------------------------------------
// 1. AUTHENTICATION SERVICE
// ----------------------------------------------------
export const authApi = {
  signup: (userData) => request('/auth/signup', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => request('/auth/me', { method: 'GET' }),
};

// ----------------------------------------------------
// 2. MOVIES SERVICE
// ----------------------------------------------------
export const moviesApi = {
  getMovies: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/movies${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  getFeatured: () => request('/movies/featured', { method: 'GET' }),
  searchMovies: (query) => request(`/movies/search?q=${encodeURIComponent(query)}`, { method: 'GET' }),
  getMovie: (idOrSlug) => request(`/movies/${idOrSlug}`, { method: 'GET' }),
};

// ----------------------------------------------------
// 3. THEATRES & SCREENS SERVICE
// ----------------------------------------------------
export const theatresApi = {
  getTheatres: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/theatres${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  getTheatre: (idOrSlug) => request(`/theatres/${idOrSlug}`, { method: 'GET' }),
  getScreens: (theatreId) => request(`/theatres/${theatreId}/screens`, { method: 'GET' }),
};

// ----------------------------------------------------
// 4. SHOWTIMES & LIVE SEATS SERVICE
// ----------------------------------------------------
export const showtimesApi = {
  getShowtimes: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/showtimes${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  getShowtime: (id) => request(`/showtimes/${id}`, { method: 'GET' }),
  getShowtimeSeats: (id) => request(`/showtimes/${id}/seats`, { method: 'GET' }),
};

// ----------------------------------------------------
// 5. SEAT HOLDS & BOOKINGS SERVICE
// ----------------------------------------------------
export const bookingsApi = {
  holdSeats: ({ showtimeId, seats, durationSeconds = 300, promoCode }) =>
    request('/bookings/hold', {
      method: 'POST',
      body: { showtimeId, seats, durationSeconds, promoCode },
    }),

  releaseHold: (holdId) =>
    request(`/bookings/hold/${holdId}`, {
      method: 'DELETE',
    }),

  createBooking: ({ holdId, idempotencyKey, contactDetails }) =>
    request('/bookings', {
      method: 'POST',
      idempotencyKey,
      body: { holdId, idempotencyKey, contactDetails },
    }),

  getMyBookings: () => request('/bookings/my', { method: 'GET' }),
  getBooking: (id) => request(`/bookings/${id}`, { method: 'GET' }),
  getBookingStatus: (id) => request(`/bookings/${id}/status`, { method: 'GET' }),
  confirmPayment: (id, paymentData) =>
    request(`/bookings/${id}/confirm-payment`, {
      method: 'POST',
      body: paymentData,
    }),
  cancelBooking: (id, reason = 'User requested cancellation') =>
    request(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: { reason },
    }),
};

// ----------------------------------------------------
// 6. PAYMENTS SERVICE (Razorpay Order & Verification)
// ----------------------------------------------------
export const paymentsApi = {
  createOrder: (bookingId) =>
    request('/payments/create-order', {
      method: 'POST',
      body: { bookingId },
    }),

  verifyPayment: ({ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
    request('/payments/verify', {
      method: 'POST',
      body: { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature },
    }),
};

// ----------------------------------------------------
// 7. ADMIN MANAGEMENT & ANALYTICS SERVICE
// ----------------------------------------------------
export const adminApi = {
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/admin/users${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  getUser: (id) => request(`/admin/users/${id}`, { method: 'GET' }),
  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  assignTheatreOrganizer: (theatreId, organizerId) =>
    request(`/admin/theatres/${theatreId}/assign-organizer`, {
      method: 'PATCH',
      body: { organizerId },
    }),
  getBookings: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/admin/bookings${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  getAnalytics: () => request('/admin/analytics', { method: 'GET' }),
};

// ----------------------------------------------------
// 8. ORGANIZER VENUE & SHOWTIMES SERVICE
// ----------------------------------------------------
export const organizerApi = {
  getProfile: () => request('/organizer/profile', { method: 'GET' }),
  getTheatres: () => request('/organizer/theatres', { method: 'GET' }),
  getShowtimes: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/organizer/showtimes${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  createShowtime: (showtimeData) =>
    request('/organizer/showtimes', {
      method: 'POST',
      body: showtimeData,
    }),
  updateShowtime: (id, showtimeData) =>
    request(`/organizer/showtimes/${id}`, {
      method: 'PUT',
      body: showtimeData,
    }),
  deleteShowtime: (id) => request(`/organizer/showtimes/${id}`, { method: 'DELETE' }),
  getBookings: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/organizer/bookings${queryStr ? `?${queryStr}` : ''}`, { method: 'GET' });
  },
  getAnalytics: () => request('/organizer/analytics', { method: 'GET' }),
};

export default {
  API_BASE_URL,
  auth: authApi,
  movies: moviesApi,
  theatres: theatresApi,
  showtimes: showtimesApi,
  bookings: bookingsApi,
  payments: paymentsApi,
  admin: adminApi,
  organizer: organizerApi,
};
