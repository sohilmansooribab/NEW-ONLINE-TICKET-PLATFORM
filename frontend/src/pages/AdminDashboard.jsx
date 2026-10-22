import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Film, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  DollarSign, 
  Ticket, 
  Sliders, 
  MoreVertical,
  Activity,
  Plus,
  Lock,
  Loader2,
  Trash2,
  UserCheck
} from 'lucide-react';
import { ADMIN_STATS, MOVIES, THEATRES } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { adminApi, theatresApi, moviesApi } from '../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const { currentUser, showToast } = useBooking();
  const [activeTab, setActiveTab] = useState('theatres'); // 'theatres' | 'users' | 'movies' | 'bookings'
  
  const [analytics, setAnalytics] = useState(null);
  const [theatresList, setTheatresList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [moviesList, setMoviesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Guard: Only ADMIN role can access
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [analyticsRes, usersRes, theatresRes, moviesRes, bookingsRes] = await Promise.allSettled([
        adminApi.getAnalytics(),
        adminApi.getUsers({ limit: 50 }),
        theatresApi.getTheatres({ limit: 50 }),
        moviesApi.getMovies({ limit: 50 }),
        adminApi.getBookings({ limit: 50 }),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.analytics) {
        setAnalytics(analyticsRes.value.analytics);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
        setUsersList(usersRes.value.users);
      }
      if (theatresRes.status === 'fulfilled' && theatresRes.value?.theatres) {
        setTheatresList(theatresRes.value.theatres);
      } else if (theatresRes.status === 'fulfilled' && theatresRes.value?.data) {
        setTheatresList(theatresRes.value.data);
      }
      if (moviesRes.status === 'fulfilled' && moviesRes.value?.data) {
        setMoviesList(moviesRes.value.data);
      }
      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.bookings) {
        setBookingsList(bookingsRes.value.bookings);
      }
    } catch (err) {
      console.warn('Admin load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Promote / Demote user role
  const handleUpdateRole = async (userId, targetRole) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUserRole(userId, targetRole);
      showToast(`User role updated to ${targetRole}.`, 'success');
      setUsersList(prev => prev.map(u => (u._id === userId || u.id === userId) ? { ...u, role: targetRole } : u));
    } catch (err) {
      showToast(err.message || 'Could not update user role.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete user account
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user account '${userName}'?`)) return;
    setActionLoading(userId);
    try {
      await adminApi.deleteUser(userId);
      showToast(`User account '${userName}' deleted.`, 'success');
      setUsersList(prev => prev.filter(u => u._id !== userId && u.id !== userId));
    } catch (err) {
      showToast(err.message || 'Could not delete user account.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Assign organizer to theatre
  const handleAssignOrganizer = async (theatreId, organizerId) => {
    try {
      await adminApi.assignTheatreOrganizer(theatreId, organizerId);
      showToast('Theatre assigned to organizer successfully!', 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message || 'Could not assign organizer.', 'error');
    }
  };

  // Unauthorized Access Screen
  if (!isAdmin) {
    return (
      <div className="dashboard-root" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="auth-card-box animate-fade-in" style={{ maxWidth: '480px', textAlign: 'center', margin: 'auto' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#E63946' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#171923' }}>
            Admin Access Restricted
          </h2>
          <p style={{ color: '#646777', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            This management control center requires verified <strong>ADMIN</strong> permissions.
            {currentUser ? ` You are currently logged in as a ${currentUser.role || 'USER'}.` : ' Please sign in with an administrator account.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">
              Sign In as Admin
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback stats if API analytics is loading
  const statsRevenue = analytics?.totalSettledRevenue ?? ADMIN_STATS.totalPlatformRevenue;
  const statsBookings = analytics?.totalBookings ?? ADMIN_STATS.totalBookingsMonth;
  const statsUsers = analytics?.totalUsers ?? ADMIN_STATS.totalRegisteredUsers;
  const statsTheatres = analytics?.totalTheatres ?? theatresList.length;

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className="dashboard-sidebar admin-sidebar">
        <div className="sidebar-brand-pane">
          <span className="sidebar-brand-name">CineBook Admin</span>
          <span className="badge badge-gold sidebar-tag">SUPERADMIN</span>
        </div>

        <nav className="sidebar-nav-menu">
          <button 
            className={`sidebar-nav-item ${activeTab === 'theatres' ? 'active' : ''}`}
            onClick={() => setActiveTab('theatres')}
          >
            <MapPin size={18} />
            <span>Theatres & Partners ({theatresList.length})</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>User Accounts ({usersList.length})</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <Ticket size={18} />
            <span>Bookings Audit ({bookingsList.length})</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            <Film size={18} />
            <span>Catalogue ({moviesList.length > 0 ? moviesList.length : MOVIES.length})</span>
          </button>
        </nav>

        <div className="sidebar-footer-theatre-card">
          <div className="footer-theatre-name">Security Status</div>
          <div className="footer-status-indicator">
            <span className="live-dot" /> All Systems Operational (RBAC Enforced)
          </div>
        </div>
      </aside>

      {/* Main Admin Area */}
      <main className="dashboard-main-area">
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div>
            <h1 className="dash-title">Platform Administration</h1>
            <p className="dash-subtitle">
              Live metrics from MongoDB backend: settled revenues, multiplex partners, and user management.
            </p>
          </div>
        </header>

        {/* Global Platform Stat Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(230, 57, 70, 0.12)', color: '#E63946' }}>
              <DollarSign size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Settled Gross Revenue</span>
              <h3 className="stat-number">₹{Number(statsRevenue).toLocaleString()}</h3>
              <span className="stat-trend positive">Strictly settled & confirmed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Ticket size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total System Bookings</span>
              <h3 className="stat-number">{statsBookings}</h3>
              <span className="stat-trend positive">Across all multiplexes</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Registered Users</span>
              <h3 className="stat-number">{statsUsers}</h3>
              <span className="stat-trend positive">Verified Accounts</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <MapPin size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Multiplex Venues</span>
              <h3 className="stat-number">{statsTheatres}</h3>
              <span className="stat-trend positive">Live Partner Venues</span>
            </div>
          </div>
        </section>

        {/* Data Tables */}
        <section className="dashboard-section-box">
          <div className="table-controls-header">
            <div className="table-tab-buttons">
              <button
                className={`table-tab ${activeTab === 'theatres' ? 'active' : ''}`}
                onClick={() => setActiveTab('theatres')}
              >
                Multiplexes ({theatresList.length})
              </button>
              <button
                className={`table-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                User Accounts ({usersList.length})
              </button>
              <button
                className={`table-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                Bookings Audit ({bookingsList.length})
              </button>
              <button
                className={`table-tab ${activeTab === 'movies' ? 'active' : ''}`}
                onClick={() => setActiveTab('movies')}
              >
                Movie Catalog ({moviesList.length > 0 ? moviesList.length : MOVIES.length})
              </button>
            </div>

            <div className="table-search-wrap">
              <Search size={16} className="table-search-icon" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="table-search-input"
              />
            </div>
          </div>

          {/* 1. Theatres Table */}
          {activeTab === 'theatres' && (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>VENUE ID</th>
                    <th>NAME</th>
                    <th>CITY</th>
                    <th>SCREENS</th>
                    <th>ASSIGNED ORGANIZER</th>
                    <th>TIER</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {theatresList.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No theatres found.</td></tr>
                  ) : (
                    theatresList.map((th) => (
                      <tr key={th._id || th.id}>
                        <td className="code-cell">{th._id ? th._id.slice(-6) : th.id}</td>
                        <td><strong>{th.name}</strong></td>
                        <td><span style={{ textTransform: 'capitalize' }}>{th.city || 'Delhi'}</span></td>
                        <td>{th.screens?.length || 2} Screens</td>
                        <td>
                          {th.organizer?.name ? (
                            <span style={{ color: '#10B981', fontWeight: 600 }}>{th.organizer.name} ({th.organizer.email})</span>
                          ) : (
                            <span style={{ color: '#F59E0B' }}>Unassigned</span>
                          )}
                        </td>
                        <td><span className="badge badge-dark">{th.partnerTier || 'Diamond'}</span></td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600 }}>
                            Active Partner
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Users Table with Live Role Management */}
          {activeTab === 'users' && (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>USER ID</th>
                    <th>FULL NAME</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>CHANGE ROLE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No registered users found.</td></tr>
                  ) : (
                    usersList.map((u) => {
                      const uId = u._id || u.id;
                      const isSelf = currentUser?._id === uId || currentUser?.id === uId || currentUser?.email === u.email;

                      return (
                        <tr key={uId}>
                          <td className="code-cell">{uId.slice(-6)}</td>
                          <td><strong>{u.name}</strong></td>
                          <td className="email-cell">{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'ADMIN' ? 'badge-gold' : u.role === 'ORGANIZER' ? 'badge-primary' : 'badge-dark'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            {!isSelf ? (
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateRole(uId, e.target.value)}
                                className="custom-select"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                disabled={actionLoading === uId}
                              >
                                <option value="USER">USER</option>
                                <option value="ORGANIZER">ORGANIZER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#646777' }}>Current Admin</span>
                            )}
                          </td>
                          <td>
                            {!isSelf && (
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#E63946', borderColor: 'rgba(230, 57, 70, 0.3)' }}
                                onClick={() => handleDeleteUser(uId, u.name)}
                                disabled={actionLoading === uId}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Bookings Audit Table */}
          {activeTab === 'bookings' && (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>REFERENCE</th>
                    <th>MOVIE & THEATRE</th>
                    <th>CUSTOMER</th>
                    <th>SEATS</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No bookings found.</td></tr>
                  ) : (
                    bookingsList.map((b) => (
                      <tr key={b._id || b.id}>
                        <td className="code-cell">{b.bookingReference || b.id}</td>
                        <td>
                          <strong>{b.showtime?.movie?.title || 'Movie'}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#646777' }}>{b.showtime?.theatre?.name}</div>
                        </td>
                        <td>
                          <div>{b.contactDetails?.name || b.user?.name || 'Customer'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#646777' }}>{b.contactDetails?.email || b.user?.email}</div>
                        </td>
                        <td>{(b.seats || []).join(', ')}</td>
                        <td><strong>₹{b.pricing?.totalAmount || b.totalAmount}</strong></td>
                        <td>
                          <span className={`status-badge ${b.paymentStatus === 'paid' ? 'live' : 'sold-out'}`}>
                            {b.paymentStatus || 'pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${b.status === 'confirmed' ? 'live' : b.status === 'cancelled' ? 'sold-out' : 'fast-filling'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Movies Catalog Table */}
          {activeTab === 'movies' && (
            <div className="table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>TITLE</th>
                    <th>INDUSTRY</th>
                    <th>GENRES</th>
                    <th>DURATION</th>
                    <th>RATING</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(moviesList.length > 0 ? moviesList : MOVIES).map((m) => (
                    <tr key={m._id || m.id || m.slug}>
                      <td><strong>{m.title}</strong></td>
                      <td><span style={{ textTransform: 'capitalize' }}>{m.industry || 'Hollywood'}</span></td>
                      <td>{(m.genres || []).join(', ')}</td>
                      <td>{m.duration}</td>
                      <td>⭐ {m.rating?.toFixed?.(1) || m.rating}</td>
                      <td>
                        <span className="status-badge live">Published</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
