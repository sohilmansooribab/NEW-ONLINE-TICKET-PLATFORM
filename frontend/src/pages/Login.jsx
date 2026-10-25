import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, showToast } = useBooking();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const verifiedUser = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const userRole = (verifiedUser?.role || 'USER').toUpperCase();
      if (userRole === 'ORGANIZER') {
        navigate('/organizer');
      } else if (userRole === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {

      setServerError(err.message || 'Invalid email or password. Please verify your credentials.');
    }
  };

  const handleQuickFill = (roleType) => {
    setServerError('');
    setErrors({});
    if (roleType === 'user') {
      setEmail('aarav.sharma@example.com');
      setPassword('password123');
    } else if (roleType === 'organizer') {
      setEmail('organizer@pvrcinemas.com');
      setPassword('password123');
    } else if (roleType === 'admin') {
      setEmail('admin@cinebook.com');
      setPassword('password123');
    }
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card-box animate-fade-in">

        <div className="auth-brand-head">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-icon-wrapper">
              <Film className="brand-icon" size={24} />
            </div>
            <span className="brand-name">
              CINE<span className="brand-highlight">BOOK</span>
            </span>
          </Link>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to access your booked tickets, exclusive premiere screenings, and CinePass rewards.
          </p>
        </div>

        <div className="quick-fill-section">
          <span className="quick-fill-label">One-Click Demo Roles:</span>
          <div className="quick-fill-buttons">
            <button
              type="button"
              className="quick-pill"
              onClick={() => handleQuickFill('user')}
            >
              Moviegoer
            </button>
            <button
              type="button"
              className="quick-pill"
              onClick={() => handleQuickFill('organizer')}
            >
              Cinema Partner
            </button>
            <button
              type="button"
              className="quick-pill"
              onClick={() => handleQuickFill('admin')}
            >
              Platform Admin
            </button>
          </div>
        </div>

        {serverError && (
          <div className="auth-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(230, 57, 70, 0.15)', border: '1px solid rgba(230, 57, 70, 0.4)', borderRadius: '8px', color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="form-input-wrap">
              <Mail size={18} className="form-input-icon" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`form-input has-left-icon ${errors.email ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="flex-between">
              <label className="form-label">Password</label>
              <span className="forgot-password-link">Forgot?</span>
            </div>
            <div className="form-input-wrap">
              <Lock size={18} className="form-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`form-input has-left-icon has-right-icon ${errors.password ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to CineBook</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-switch">
          <span>Don't have an account yet?</span>
          <Link to="/signup" className="auth-switch-link">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
