import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Ticket, 
  Plus, 
  DollarSign, 
  Trash2, 
  X,
  Search,
  Lock,
  Loader2,
  MapPin
} from 'lucide-react';
import { ORGANIZER_STATS, MOVIES, THEATRES } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { organizerApi, moviesApi } from '../services/api';
import './Dashboard.css';

const OrganizerDashboard = () => {
  const { currentUser, showToast } = useBooking();
  const [activeNav, setActiveNav] = useState('overview'); 

  const [theatresList, setTheatresList] = useState([]);
  const [showsList, setShowsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [searchTable, setSearchTable] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddShowOpen, setIsAddShowOpen] = useState(false);
  const [newShowData, setNewShowData] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    startTime: '2026-10-25T18:00',
    format: 'IMAX 3D',
    priceClassic: 280,
    pricePremium: 380,
    priceVIP: 520,
  });

  const isAuthorized = ['ORGANIZER', 'ADMIN'].includes(currentUser?.role?.toUpperCase());

  const loadOrganizerData = useCallback(async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    try {
      const [theatresRes, showsRes, analyticsRes, bookingsRes, moviesRes] = await Promise.allSettled([
        organizerApi.getTheatres(),
        organizerApi.getShowtimes({ limit: 50 }),
        organizerApi.getAnalytics(),
        organizerApi.getBookings({ limit: 50 }),
        moviesApi.getMovies({ limit: 50 }),
      ]);

      let loadedTheatres = [];
      if (theatresRes.status === 'fulfilled' && theatresRes.value?.theatres) {
        loadedTheatres = theatresRes.value.theatres;
        setTheatresList(loadedTheatres);
      }

      if (showsRes.status === 'fulfilled' && showsRes.value?.showtimes) {
        setShowsList(showsRes.value.showtimes);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.analytics) {
        setAnalytics(analyticsRes.value.analytics);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.bookings) {
        setBookingsList(bookingsRes.value.bookings);
      }

      if (moviesRes.status === 'fulfilled' && moviesRes.value?.data) {
        setAvailableMovies(moviesRes.value.data);
        if (moviesRes.value.data.length > 0 && !newShowData.movieId) {
          setNewShowData(prev => ({ ...prev, movieId: moviesRes.value.data[0]._id }));
        }
      }

      if (loadedTheatres.length > 0 && !newShowData.theatreId) {
        const firstTh = loadedTheatres[0];
        setNewShowData(prev => ({
          ...prev,
          theatreId: firstTh._id,
          screenId: firstTh.screens?.[0]?._id || '',
        }));
      }
    } catch (err) {
      console.warn('Organizer load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    loadOrganizerData();
  }, [loadOrganizerData]);

  const handleAddShowSubmit = async (e) => {
    e.preventDefault();
    if (!newShowData.theatreId || !newShowData.screenId || !newShowData.movieId) {
      showToast('Please select movie, theatre, and screen.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await organizerApi.createShowtime({
        movieId: newShowData.movieId,
        theatreId: newShowData.theatreId,
        screenId: newShowData.screenId,
        startTime: new Date(newShowData.startTime).toISOString(),
        format: newShowData.format,
        tierPricing: {
          'Classic': Number(newShowData.priceClassic) || 280,
          'Premium': Number(newShowData.pricePremium) || 380,
          'VIP Recliner': Number(newShowData.priceVIP) || 520,
        },
      });

      showToast('New screening scheduled successfully!', 'success');
      setIsAddShowOpen(false);
      loadOrganizerData();
    } catch (err) {
      if (err.status === 409) {
        showToast(err.message || 'Showtime overlap conflict detected on this screen.', 'error');
      } else {
        showToast(err.message || 'Could not schedule showtime.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled showtime?')) return;
    try {
      await organizerApi.deleteShowtime(id);
      showToast('Showtime cancelled successfully.', 'success');
      setShowsList(prev => prev.filter(s => s._id !== id && s.id !== id));
    } catch (err) {
      showToast(err.message || 'Could not cancel showtime.', 'error');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="dashboard-root" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="auth-card-box animate-fade-in" style={{ maxWidth: '480px', textAlign: 'center', margin: 'auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#E63946' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#171923' }}>
            Partner Access Restricted
          </h2>
          <p style={{ color: '#646777', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            The Multiplex Organizer Portal is strictly restricted to authorized cinema venue managers.
            {currentUser ? ` You are signed in as a ${currentUser.role || 'USER'}.` : ' Please sign in with an organizer account.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">
              Sign In as Partner
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assignedTheatre = theatresList[0] || THEATRES[0];
  const statsRevenue = analytics?.totalSettledRevenue ?? ORGANIZER_STATS.todayRevenue;
  const statsBookings = analytics?.totalBookings ?? ORGANIZER_STATS.todayTickets;
  const statsTheatresCount = analytics?.assignedTheatresCount ?? theatresList.length;

  const filteredShows = showsList.filter(s => {
    const title = s.movie?.title || s.movieTitle || '';
    const scrName = s.screen?.name || s.screen || '';
    return title.toLowerCase().includes(searchTable.toLowerCase()) || scrName.toLowerCase().includes(searchTable.toLowerCase());
  });

  return (
    <div className="dashboard-root">

      <aside className="dashboard-sidebar">
        <div className="sidebar-brand-pane">
          <span className="sidebar-brand-name">CineBook Partner</span>
          <span className="badge badge-primary sidebar-tag">ORGANIZER</span>
        </div>

        <nav className="sidebar-nav-menu">
          <button 
            className={`sidebar-nav-item ${activeNav === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveNav('overview')}
          >
            <LayoutDashboard size={18} />
            <span>Overview & Stats</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeNav === 'shows' ? 'active' : ''}`}
            onClick={() => setActiveNav('shows')}
          >
            <Calendar size={18} />
            <span>Showtimes ({showsList.length})</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeNav === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveNav('sales')}
          >
            <Ticket size={18} />
            <span>Ticket Orders ({bookingsList.length})</span>
          </button>
        </nav>

        <div className="sidebar-footer-theatre-card">
          <div className="footer-theatre-label">Assigned Venue</div>
          <div className="footer-theatre-name">{assignedTheatre.name}</div>
          <div className="footer-status-indicator">
            <span className="live-dot" /> {theatresList.length > 0 ? 'Verified Partner Venue' : 'Pending Venue Assignment'}
          </div>
        </div>
      </aside>

      <main className="dashboard-main-area">

        <header className="dashboard-topbar">
          <div>
            <h1 className="dash-title">Cinema Partner Portal</h1>
            <p className="dash-subtitle">
              Manage screen scheduling and box office analytics strictly for <strong>{assignedTheatre.name}</strong>.
            </p>
          </div>

          <button 
            type="button" 
            className="btn btn-primary dash-action-btn"
            onClick={() => setIsAddShowOpen(true)}
            disabled={theatresList.length === 0}
          >
            <Plus size={18} />
            <span>Schedule Showtime</span>
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(230, 57, 70, 0.12)', color: '#E63946' }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Venue Settled Revenue</span>
              <h3 className="stat-number">₹{Number(statsRevenue).toLocaleString()}</h3>
              <span className="stat-trend positive">Strictly settled bookings</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <Ticket size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Confirmed Venue Bookings</span>
              <h3 className="stat-number">{statsBookings}</h3>
              <span className="stat-trend positive">At assigned venue</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Calendar size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Showtimes</span>
              <h3 className="stat-number">{showsList.length}</h3>
              <span className="stat-trend positive">On assigned screens</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <MapPin size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Assigned Multiplexes</span>
              <h3 className="stat-number">{statsTheatresCount}</h3>
              <span className="stat-trend positive">{assignedTheatre.location || 'Central'}</span>
            </div>
          </div>
        </section>

        <section className="dashboard-section-box">
          <div className="table-controls-header">
            <div>
              <h3 className="section-box-title">
                {activeNav === 'sales' ? 'Customer Orders at Your Venue' : 'Scheduled Screenings'}
              </h3>
              <p className="section-box-desc">
                {activeNav === 'sales' 
                  ? 'Real-time verified customer bookings and ticket details' 
                  : 'Real-time auditorium schedule on MongoDB with conflict collision prevention'}
              </p>
            </div>

            <div className="table-search-wrap">
              <Search size={16} className="table-search-icon" />
              <input
                type="text"
                placeholder="Search screenings..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                className="table-search-input"
              />
            </div>
          </div>

          {activeNav === 'sales' ? (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>ORDER REF</th>
                    <th>MOVIE</th>
                    <th>CUSTOMER</th>
                    <th>SEATS</th>
                    <th>TOTAL</th>
                    <th>PAYMENT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No customer bookings recorded yet for this venue.</td></tr>
                  ) : (
                    bookingsList.map((b) => (
                      <tr key={b._id || b.id}>
                        <td className="code-cell">{b.bookingReference || b.id}</td>
                        <td><strong>{b.showtime?.movie?.title || 'Movie'}</strong></td>
                        <td>{b.contactDetails?.name || 'Customer'}</td>
                        <td>{(b.seats || []).join(', ')}</td>
                        <td><strong>₹{b.pricing?.totalAmount || b.totalAmount}</strong></td>
                        <td>
                          <span className={`status-badge ${b.paymentStatus === 'paid' ? 'live' : 'sold-out'}`}>
                            {b.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${b.status === 'confirmed' ? 'live' : 'sold-out'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>SHOW ID</th>
                    <th>MOVIE TITLE</th>
                    <th>AUDITORIUM / SCREEN</th>
                    <th>SHOWTIME</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShows.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No showtimes found. Click "Schedule Showtime" above.</td></tr>
                  ) : (
                    filteredShows.map((show) => {
                      const showId = show._id || show.id;
                      const startTime = show.startTime ? new Date(show.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (show.time || '06:00 PM');
                      const dateStr = show.startTime ? new Date(show.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : (show.date || 'Today');

                      return (
                        <tr key={showId}>
                          <td className="code-cell">{showId.slice(-6)}</td>
                          <td><strong>{show.movie?.title || show.movieTitle}</strong></td>
                          <td>{show.screen?.name || show.screen}</td>
                          <td>{dateStr} • {startTime}</td>
                          <td>
                            <span className="status-badge live">
                              {show.computedStatus || show.status || 'Live'}
                            </span>
                          </td>
                          <td>
                            <div className="table-row-actions">
                              <button 
                                type="button" 
                                className="action-icon-btn delete"
                                onClick={() => handleDeleteShow(showId)}
                                title="Cancel Showtime"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {isAddShowOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddShowOpen(false)}>
          <div className="modal-box animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Schedule New Showtime</h3>
              <button className="modal-close" onClick={() => setIsAddShowOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddShowSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Movie</label>
                <select
                  value={newShowData.movieId}
                  onChange={(e) => setNewShowData({ ...newShowData, movieId: e.target.value })}
                  className="form-input"
                  required
                >
                  {(availableMovies.length > 0 ? availableMovies : MOVIES).map(m => (
                    <option key={m._id || m.id} value={m._id || m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Auditorium / Screen</label>
                <select
                  value={newShowData.screenId}
                  onChange={(e) => setNewShowData({ ...newShowData, screenId: e.target.value })}
                  className="form-input"
                  required
                >
                  {assignedTheatre.screens?.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name} ({s.format || 'IMAX Laser'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newShowData.startTime}
                    onChange={(e) => setNewShowData({ ...newShowData, startTime: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select
                    value={newShowData.format}
                    onChange={(e) => setNewShowData({ ...newShowData, format: e.target.value })}
                    className="form-input"
                  >
                    <option value="IMAX 3D">IMAX 3D</option>
                    <option value="IMAX Laser">IMAX Laser</option>
                    <option value="4DX">4DX</option>
                    <option value="2D">2D Standard</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Classic Seat Price (₹)</label>
                  <input
                    type="number"
                    value={newShowData.priceClassic}
                    onChange={(e) => setNewShowData({ ...newShowData, priceClassic: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Premium Seat Price (₹)</label>
                  <input
                    type="number"
                    value={newShowData.pricePremium}

                    onChange={(e) => setNewShowData({ ...newShowData, priceClassic: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsAddShowOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Publish to CineBook</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
