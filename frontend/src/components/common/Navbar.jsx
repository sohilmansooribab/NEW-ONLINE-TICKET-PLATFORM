import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Film, 
  MapPin, 
  Search, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  Ticket, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { CITIES } from '../../data/mockData';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedCity, 
    setSelectedCity, 
    searchQuery, 
    setSearchQuery, 
    currentUser, 
    logout 
  } = useBooking();

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const cityRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setCityDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local search with global
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    if (location.pathname !== '/movies') {
      navigate('/movies');
    }
  };

  const handleCitySelect = (cityId) => {
    setSelectedCity(cityId);
    setCityDropdownOpen(false);
  };

  const currentCityObj = CITIES.find(c => c.id === selectedCity) || CITIES[0];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Left: Brand Logo & City */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon-wrapper">
              <Film className="brand-icon" size={22} />
              <div className="brand-dot" />
            </div>
            <span className="brand-name">
              CINE<span className="brand-highlight">BOOK</span>
            </span>
          </Link>

          {/* City Selector */}
          <div className="city-selector-wrap" ref={cityRef}>
            <button 
              className={`city-btn ${cityDropdownOpen ? 'active' : ''}`}
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              aria-label="Select City"
            >
              <MapPin size={16} className="city-pin-icon" />
              <span className="city-name">{currentCityObj.name}</span>
              <ChevronDown size={14} className={`city-arrow ${cityDropdownOpen ? 'rotate' : ''}`} />
            </button>

            {cityDropdownOpen && (
              <div className="city-dropdown-menu">
                <div className="city-dropdown-header">
                  <span>Select Your City</span>
                  <Sparkles size={14} color="#E63946" />
                </div>
                <div className="city-list">
                  {CITIES.map(city => (
                    <button
                      key={city.id}
                      className={`city-item ${city.id === selectedCity ? 'selected' : ''}`}
                      onClick={() => handleCitySelect(city.id)}
                    >
                      <span className="city-item-name">{city.name}</span>
                      <span className="city-item-badge">{city.count} Theatres</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="navbar-center">
          <form onSubmit={handleSearchSubmit} className="nav-search-form">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search movies, genres, theatres..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="search-input"
            />
            {localSearch && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>

        {/* Right: Navigation Links & User Menu */}
        <div className="navbar-right">
          <nav className="nav-links-desktop">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/movies" className={`nav-link ${isActive('/movies') && !location.search ? 'active' : ''}`}>
              Movies
            </Link>
            <Link to="/movies?category=bollywood" className={`nav-link ${location.search.includes('bollywood') ? 'active' : ''}`}>
              Bollywood
            </Link>
            <Link to="/movies?category=hollywood" className={`nav-link ${location.search.includes('hollywood') ? 'active' : ''}`}>
              Hollywood
            </Link>
            <Link to="/movies?filter=upcoming" className={`nav-link ${location.search.includes('upcoming') ? 'active' : ''}`}>
              Upcoming
            </Link>
            <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}>
              My Bookings
            </Link>
          </nav>

          {/* User Profile or Login */}
          <div className="user-menu-wrap" ref={userRef}>
            {currentUser ? (
              <div className="user-profile-btn-wrap">
                <button
                  className="user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User Account Menu"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                    alt={currentUser.name}
                    className="user-avatar"
                  />
                  <span className="user-firstname">{currentUser.name?.split ? currentUser.name.split(' ')[0] : (currentUser.name || 'User')}</span>
                  <ChevronDown size={14} className={`user-arrow ${userDropdownOpen ? 'rotate' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-info-header">
                      <p className="user-info-name">{currentUser.name}</p>
                      <p className="user-info-email">{currentUser.email}</p>
                      <span className="user-role-badge">
                        {currentUser.role ? currentUser.role.toUpperCase() : 'USER'}
                      </span>
                    </div>

                    <div className="dropdown-divider" />

                    <Link 
                      to="/my-bookings" 
                      className="dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Ticket size={16} />
                      <span>My Bookings</span>
                    </Link>

                    {['ORGANIZER', 'ADMIN'].includes(currentUser.role?.toUpperCase()) && (
                      <Link 
                        to="/organizer" 
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        <span>Organizer Portal</span>
                      </Link>
                    )}

                    {currentUser.role?.toUpperCase() === 'ADMIN' && (
                      <Link 
                        to="/admin" 
                        className="dropdown-item"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ShieldCheck size={16} />
                        <span>Admin Control</span>
                      </Link>
                    )}

                    <div className="dropdown-divider" />

                    <button 
                      className="dropdown-item logout-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search movies, theatres..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="search-input"
            />
          </form>

          <nav className="mobile-nav-links">
            <Link 
              to="/" 
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/movies" 
              className={`mobile-nav-link ${isActive('/movies') && !location.search ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              All Movies
            </Link>
            <Link 
              to="/movies?category=bollywood" 
              className={`mobile-nav-link ${location.search.includes('bollywood') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Bollywood Movies
            </Link>
            <Link 
              to="/movies?category=hollywood" 
              className={`mobile-nav-link ${location.search.includes('hollywood') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Hollywood Movies
            </Link>
            <Link 
              to="/movies?filter=upcoming" 
              className={`mobile-nav-link ${location.search.includes('upcoming') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Upcoming Releases
            </Link>
            <Link 
              to="/my-bookings" 
              className={`mobile-nav-link ${isActive('/my-bookings') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              My Bookings
            </Link>
            {['ORGANIZER', 'ADMIN'].includes(currentUser?.role?.toUpperCase()) && (
              <Link 
                to="/organizer" 
                className={`mobile-nav-link ${isActive('/organizer') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Organizer Dashboard
              </Link>
            )}
            {currentUser?.role?.toUpperCase() === 'ADMIN' && (
              <Link 
                to="/admin" 
                className={`mobile-nav-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          <div className="mobile-drawer-footer">
            {currentUser ? (
              <div className="mobile-user-actions">
                <div className="mobile-user-card">
                  <img 
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} 
                    alt={currentUser.name || 'User'} 
                    className="user-avatar" 
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#A0A3B1' }}>{currentUser.email}</div>
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link 
                  to="/login" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
