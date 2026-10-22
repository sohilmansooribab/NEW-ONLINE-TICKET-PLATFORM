import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, showToast } = useBooking();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
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
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!agreeTerms) {
      errs.terms = 'Please accept the CineBook terms of service.';
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
      await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      showToast(`Welcome to CineBook, ${name.trim()}! Your account is ready.`);
      navigate('/');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-root">
      <div className="auth-card-box animate-fade-in">
        {/* Brand Header */}
        <div className="auth-brand-head">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-icon-wrapper">
              <Film className="brand-icon" size={24} />
            </div>
            <span className="brand-name">
              CINE<span className="brand-highlight">BOOK</span>
            </span>
          </Link>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Join CineBook to enjoy priority ticket bookings, zero cancellation fees, and IMAX rewards.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="auth-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(230, 57, 70, 0.15)', border: '1px solid rgba(230, 57, 70, 0.4)', borderRadius: '8px', color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="form-input-wrap">
              <User size={18} className="form-input-icon" />
              <input
                type="text"
                placeholder="Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`form-input has-left-icon ${errors.name ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

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
            <label className="form-label">Password (Min 6 Characters)</label>
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="form-input-wrap">
              <Lock size={18} className="form-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`form-input has-left-icon ${errors.confirmPassword ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group terms-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="custom-checkbox"
                disabled={isSubmitting}
              />
              <span>
                I agree to the <span className="terms-highlight">Terms of Service</span> and{' '}
                <span className="terms-highlight">Privacy Policy</span>.
              </span>
            </label>
            {errors.terms && <span className="form-error">{errors.terms}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create My Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="auth-footer-switch">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-switch-link">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
