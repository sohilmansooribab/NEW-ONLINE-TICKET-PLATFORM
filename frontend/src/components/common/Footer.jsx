import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Send, ShieldCheck, Headphones, Smartphone, Sparkles } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useBooking();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    showToast('Subscribed! You will receive premiere alerts & offers.');
    setEmail('');
  };

  return (
    <footer className="footer-root">
      {/* Newsletter Section */}
      <div className="newsletter-banner">
        <div className="container newsletter-content">
          <div className="newsletter-text">
            <span className="newsletter-tag">
              <Sparkles size={14} /> EXCLUSIVE PREVIEWS & OFFERS
            </span>
            <h3 className="newsletter-title">Subscribe to CineBook Premier Club</h3>
            <p className="newsletter-desc">
              Get secret screening invitations, 20% discount codes, and weekly movie updates right to your inbox.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="newsletter-input"
            />
            <button type="submit" className="btn btn-primary newsletter-btn">
              <span>Subscribe</span>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container footer-main">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-brand">
              <div className="brand-icon-wrapper">
                <Film className="brand-icon" size={20} />
              </div>
              <span className="brand-name">
                CINE<span className="brand-highlight">BOOK</span>
              </span>
            </Link>
            <p className="footer-about">
              Experience cinema redefined. Discover trending blockbusters, reserve luxury recliners, and book IMAX 3D tickets with zero hassle.
            </p>
            <div className="footer-features">
              <div className="feature-item">
                <ShieldCheck size={16} color="#10B981" />
                <span>100% Secure Instant Bookings</span>
              </div>
              <div className="feature-item">
                <Headphones size={16} color="#3B82F6" />
                <span>24/7 Priority Support</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Now Showing</h4>
            <ul className="footer-links">
              <li><Link to="/movie/dune-2">Dune: Part Two (IMAX)</Link></li>
              <li><Link to="/movie/oppenheimer">Oppenheimer</Link></li>
              <li><Link to="/movie/deadpool-wolverine">Deadpool & Wolverine</Link></li>
              <li><Link to="/movie/interstellar">Interstellar 10th Anniv.</Link></li>
              <li><Link to="/movie/kalki-2898">Kalki 2898 AD</Link></li>
              <li><Link to="/movies">View All 40+ Movies</Link></li>
            </ul>
          </div>

          {/* Cinematic Formats */}
          <div className="footer-col">
            <h4 className="footer-heading">Experiences</h4>
            <ul className="footer-links">
              <li><span className="footer-static-link">IMAX Laser 4K</span></li>
              <li><span className="footer-static-link">4DX Dynamic Motion</span></li>
              <li><span className="footer-static-link">Dolby Atmos Surround</span></li>
              <li><span className="footer-static-link">Director's Cut Luxury</span></li>
              <li><span className="footer-static-link">CinePass Subscription</span></li>
            </ul>
          </div>

          {/* Quick Portals */}
          <div className="footer-col">
            <h4 className="footer-heading">CineBook Portals</h4>
            <ul className="footer-links">
              <li><Link to="/my-bookings">My Tickets & QR</Link></li>
              <li><Link to="/organizer">Cinema Partner Portal</Link></li>
              <li><Link to="/admin">Admin Management</Link></li>
              <li><Link to="/login">Account Sign In</Link></li>
              <li><Link to="/signup">Join CineBook</Link></li>
            </ul>
          </div>
        </div>

        {/* Cities Bar */}
        <div className="footer-cities">
          <span className="cities-label">Popular Multiplex Hubs:</span>
          <div className="cities-tags">
            <span>Delhi-NCR</span> • <span>Mumbai</span> • <span>Bengaluru</span> • <span>Hyderabad</span> • <span>Chennai</span> • <span>Pune</span> • <span>Kolkata</span> • <span>Ahmedabad</span> • <span>Chandigarh</span> • <span>Jaipur</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 CineBook Entertainment Ltd. All rights reserved. Built for cinema lovers.
          </p>
          <div className="footer-bottom-links">
            <span className="legal-link">Privacy Policy</span>
            <span className="legal-link">Terms of Service</span>
            <span className="legal-link">Cookie Preferences</span>
            <span className="legal-link">Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
