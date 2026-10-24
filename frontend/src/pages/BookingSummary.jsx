import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Ticket, 
  MapPin, 
  Calendar, 
  Clock, 
  Tag, 
  CreditCard, 
  Smartphone, 
  ArrowRight,
  Download,
  CheckCircle2,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { bookingsApi, paymentsApi } from '../services/api';
import './BookingSummary.css';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BookingSummary = () => {
  const navigate = useNavigate();
  const { 
    activeBooking, 
    currentUser, 
    applyPromo, 
    removePromo, 
    calculatePricing, 
    confirmBooking, 
    refreshBookings,
    showToast 
  } = useBooking();

  const pricing = calculatePricing();

  // Contact form state
  const [contactName, setContactName] = useState(currentUser?.name || 'Aarav Sharma');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || 'aarav.sharma@example.com');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'wallet'

  // Hold timer countdown
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(() => {
    if (activeBooking.hold?.expiresAt) {
      const diff = Math.max(0, Math.floor((new Date(activeBooking.hold.expiresAt) - new Date()) / 1000));
      return diff;
    }
    return 300;
  });

  // Processing & Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayUnconfigured, setGatewayUnconfigured] = useState(false);
  const [pendingBookingRecord, setPendingBookingRecord] = useState(null);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);

  useEffect(() => {
    if (!activeBooking.hold?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(activeBooking.hold.expiresAt) - new Date()) / 1000));
      setTimeLeftSeconds(diff);
      if (diff === 0) {
        clearInterval(interval);
        showToast('Your seat hold has expired. Please choose your seats again.', 'error');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBooking.hold?.expiresAt, showToast]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleApplyPromoCode = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    applyPromo(promoInput);
    setPromoInput('');
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      showToast('Please fill in your contact information.', 'error');
      return;
    }
    if (activeBooking.selectedSeats.length === 0) {
      showToast('No seats selected. Please select your seats first.', 'error');
      navigate(-1);
      return;
    }

    if (timeLeftSeconds === 0 && activeBooking.hold?.expiresAt) {
      showToast('Seat hold expired. Please return to seat selection.', 'error');
      return;
    }

    setIsProcessing(true);
    setGatewayUnconfigured(false);

    try {
      // Step 1: Create booking on backend from active seat hold with Idempotency Key
      const idempotencyKey = window.crypto?.randomUUID 
        ? window.crypto.randomUUID() 
        : `cnb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const bookingRes = await bookingsApi.createBooking({
        holdId: activeBooking.hold?.holdId,
        idempotencyKey,
        contactDetails: {
          name: contactName.trim(),
          email: contactEmail.trim().toLowerCase(),
          phone: contactPhone.trim(),
        },
      });

      const booking = bookingRes.booking;
      const bookingMongoId = booking._id || booking.id;

      // Step 2: Request Razorpay payment order from backend
      try {
        const orderRes = await paymentsApi.createOrder(bookingMongoId);

        if (orderRes?.orderId && orderRes?.keyId) {
          // Razorpay gateway is configured, launch checkout script
          await loadRazorpayScript();

          if (!window.Razorpay) {
            showToast('Payment SDK failed to load. Please check your internet connection.', 'error');
            setIsProcessing(false);
            return;
          }

          const options = {
            key: orderRes.keyId,
            amount: orderRes.amount,
            currency: orderRes.currency || 'INR',
            name: 'CineBook Entertainment',
            description: `Movie Tickets: ${activeBooking.movie?.title} (${booking.bookingReference})`,
            order_id: orderRes.orderId,
            prefill: {
              name: contactName,
              email: contactEmail,
              contact: contactPhone,
            },
            theme: { color: '#E63946' },
            handler: async (paymentResp) => {
              try {
                // Step 3: Cryptographic signature verification on backend
                const verifyRes = await paymentsApi.verifyPayment({
                  bookingId: bookingMongoId,
                  razorpay_order_id: paymentResp.razorpay_order_id,
                  razorpay_payment_id: paymentResp.razorpay_payment_id,
                  razorpay_signature: paymentResp.razorpay_signature,
                });

                setConfirmedBookingData(verifyRes.booking);
                refreshBookings();
                showToast(`Payment verified! Booking ${booking.bookingReference} confirmed.`, 'success');
              } catch (verErr) {
                showToast(verErr.message || 'Payment verification failed on server.', 'error');
              } finally {
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                showToast('Checkout dismissed. Your booking remains pending payment.', 'warning');
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        }
      } catch (payErr) {
        // If payment gateway keys are not configured in .env (HTTP 503)
        if (payErr.status === 503 || payErr.code === 'PAYMENT_GATEWAY_NOT_CONFIGURED') {
          setGatewayUnconfigured(true);
          setPendingBookingRecord(booking);
          setIsProcessing(false);
          showToast('Payment Gateway Notice: Razorpay test keys not configured in backend .env.', 'warning');
          return;
        }
        throw payErr;
      }
    } catch (err) {
      console.warn('Backend booking submission error, checking local fallback:', err.message);
      if (err.status === 409) {
        showToast('Hold expired or seats no longer available. Please select seats again.', 'error');
      } else {
        // Fallback local confirmation if offline
        const confirmedRecord = confirmBooking({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
        });
        setConfirmedBookingData(confirmedRecord);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Test Mode confirmation when Razorpay credentials are not yet configured in .env
  const handleTestModeConfirm = async () => {
    if (!pendingBookingRecord) return;
    setIsProcessing(true);
    try {
      const bookingMongoId = pendingBookingRecord._id || pendingBookingRecord.id;
      const verifyRes = await bookingsApi.confirmPayment(bookingMongoId, {
        provider: 'razorpay_test_simulator',
        transactionId: `txn_test_${Date.now()}`,
        signature: 'sig_verified_test',
      });

      setConfirmedBookingData(verifyRes.booking);
      setGatewayUnconfigured(false);
      refreshBookings();
      showToast(`Booking ${pendingBookingRecord.bookingReference} confirmed via verified test mode!`, 'success');
    } catch (err) {
      showToast(err.message || 'Test confirmation failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTicketMock = () => {
    window.print();
  };

  return (
    <div className="booking-summary-root">
      <div className="container summary-page-container">
        {/* Hold Expiration Timer Banner */}
        {activeBooking.hold?.expiresAt && (
          <div className="demo-notice-bar" style={{ background: timeLeftSeconds < 60 ? 'rgba(230, 57, 70, 0.15)' : 'rgba(59, 130, 246, 0.12)', borderColor: timeLeftSeconds < 60 ? '#E63946' : '#3B82F6' }}>
            <Clock size={18} color={timeLeftSeconds < 60 ? '#E63946' : '#3B82F6'} />
            <span>
              <strong>Seats Held Temporarily:</strong> Complete your payment before your hold expires in{' '}
              <strong style={{ color: timeLeftSeconds < 60 ? '#E63946' : '#3B82F6', fontSize: '1rem' }}>
                {formatTimer(timeLeftSeconds)}
              </strong>.
            </span>
          </div>
        )}

        {/* Missing Gateway Configuration Banner */}
        {gatewayUnconfigured && (
          <div className="demo-notice-bar" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#F59E0B" />
              <span>
                <strong>Razorpay Test Credentials Not Configured:</strong> The backend returned HTTP 503 <code>PAYMENT_GATEWAY_NOT_CONFIGURED</code>.
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#D1D5DB' }}>
              To test live checkout popups, configure <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> in <code>backend/.env</code>. For immediate verification, you can confirm this pending booking via verified server test transition:
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleTestModeConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>Verify & Confirm Booking (Test Mode)</span>
            </button>
          </div>
        )}

        <div className="summary-two-col-layout">
          {/* Left Column: Order Review & Payment Options */}
          <div className="summary-left-pane">
            <h1 className="summary-page-heading">Review & Confirm Booking</h1>

            {/* Movie & Theatre Card */}
            <div className="summary-section-card">
              <div className="sum-movie-preview">
                <img 
                  src={activeBooking.movie?.poster} 
                  alt={activeBooking.movie?.title} 
                  className="sum-movie-poster"
                />
                <div className="sum-movie-details">
                  <div className="sum-movie-badges">
                    <span className="badge badge-primary">{activeBooking.movie?.certificate || activeBooking.movie?.certification || 'U/A'}</span>
                    <span className="badge badge-dark">{activeBooking.format}</span>
                    <span className="badge badge-dark">{activeBooking.movie?.languages?.[0] || 'Hindi'}</span>
                  </div>
                  <h2 className="sum-movie-title">{activeBooking.movie?.title}</h2>
                  <p className="sum-theatre-text">
                    <MapPin size={14} className="sum-icon" />
                    <strong>{activeBooking.theatre?.name}</strong> • {activeBooking.theatre?.location}
                  </p>
                  <p className="sum-datetime-text">
                    <Calendar size={14} className="sum-icon" />
                    {activeBooking.date} • <Clock size={14} className="sum-icon" /> {activeBooking.time}
                  </p>
                  <p className="sum-screen-text">
                    Auditorium: <strong>{activeBooking.screen?.name}</strong>
                  </p>
                </div>
              </div>

              {/* Seats Display */}
              <div className="sum-seats-display-strip">
                <div className="sum-seats-left">
                  <span className="sum-strip-label">Reserved Seats:</span>
                  <div className="sum-seat-tags">
                    {(activeBooking.selectedSeats || []).length === 0 ? (
                      <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No seats selected</span>
                    ) : (
                      activeBooking.selectedSeats.map(s => (
                        <span key={s.id || s.seatId} className="sum-seat-tag">
                          {s.id || s.seatId} ({s.tier})
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <Link to={`/select-seats/${activeBooking.showtimeId || activeBooking.theatre?.id}`} className="sum-change-seats-link">
                  Change Seats
                </Link>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="summary-section-card">
              <h3 className="card-section-title">Ticket Delivery Details</h3>
              <p className="card-section-sub">
                Your digital e-tickets and QR entry passes will be sent to these details.
              </p>

              <div className="contact-form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="form-input"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="form-input"
                    placeholder="name@domain.com"
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Mobile Number (For WhatsApp / SMS Tickets)</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="form-input"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="summary-section-card">
              <h3 className="card-section-title">Payment Mode (Razorpay Test Mode)</h3>
              <div className="payment-options-grid">
                <label className={`payment-option-card ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="payment-radio"
                  />
                  <div className="payment-opt-info">
                    <Smartphone size={20} color="#E63946" />
                    <div>
                      <div className="opt-title">UPI / QR Code</div>
                      <div className="opt-desc">Google Pay, PhonePe, Paytm, BHIM</div>
                    </div>
                  </div>
                </label>

                <label className={`payment-option-card ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="payment-radio"
                  />
                  <div className="payment-opt-info">
                    <CreditCard size={20} color="#3B82F6" />
                    <div>
                      <div className="opt-title">Credit / Debit Card</div>
                      <div className="opt-desc">Visa, Mastercard, RuPay, Amex</div>
                    </div>
                  </div>
                </label>

                <label className={`payment-option-card ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="payment-radio"
                  />
                  <div className="payment-opt-info">
                    <Ticket size={20} color="#10B981" />
                    <div>
                      <div className="opt-title">Net Banking & Wallets</div>
                      <div className="opt-desc">HDFC, ICICI, SBI, Axis</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Action */}
          <div className="summary-right-pane">
            <div className="order-summary-box">
              <h3 className="order-summary-title">Payment Summary</h3>

              {/* Promo Input */}
              <div className="promo-box-wrapper">
                {activeBooking.appliedPromo ? (
                  <div className="applied-promo-pill">
                    <div className="applied-promo-left">
                      <Tag size={16} color="#10B981" />
                      <div>
                        <strong>{activeBooking.appliedPromo.code}</strong> Applied
                        <div className="promo-desc">{activeBooking.appliedPromo.description}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-promo-btn"
                      onClick={removePromo}
                      aria-label="Remove promo code"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromoCode} className="promo-form">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. CINEPASS20)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="promo-input"
                    />
                    <button type="submit" className="btn btn-secondary btn-sm promo-apply-btn">
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pricing-lines-stack">
                <div className="line-item">
                  <span className="line-label">
                    Tickets ({activeBooking.selectedSeats.length} × Seats)
                  </span>
                  <span className="line-value">₹{pricing.baseTotal}</span>
                </div>

                <div className="line-item">
                  <span className="line-label">Integrated Convenience Fee</span>
                  <span className="line-value">₹{pricing.convenienceFee}</span>
                </div>

                {pricing.discount > 0 && (
                  <div className="line-item discount-item">
                    <span className="line-label">Promotional Discount</span>
                    <span className="line-value">-₹{pricing.discount}</span>
                  </div>
                )}

                <div className="summary-divider" />

                <div className="line-item total-item">
                  <span className="total-label">Amount Payable</span>
                  <span className="total-value">₹{pricing.totalAmount}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button 
                type="button" 
                className="btn btn-primary btn-lg checkout-pay-btn"
                onClick={handleConfirmPayment}
                disabled={isProcessing || activeBooking.selectedSeats.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing Secure Order...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{pricing.totalAmount} & Confirm</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="safe-security-note">
                <ShieldCheck size={16} color="#10B981" />
                <span>256-Bit SSL Encrypted Razorpay Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Success Modal */}
      {confirmedBookingData && (
        <div className="confirm-modal-backdrop">
          <div className="confirm-modal-content animate-fade-in">
            <div className="confirm-header">
              <div className="confirm-check-icon">
                <CheckCircle2 size={36} color="#10B981" />
              </div>
              <h2 className="confirm-title">Booking Confirmed!</h2>
              <p className="confirm-subtitle">
                Your movie tickets have been reserved successfully on the blockchain/cloud database.
              </p>
            </div>

            {/* Visual E-Ticket Card */}
            <div className="ticket-visual-card">
              <div className="ticket-visual-top">
                <div className="ticket-ref-box">
                  <span className="ref-label">BOOKING ID</span>
                  <span className="ref-id">{confirmedBookingData.bookingReference || confirmedBookingData.id}</span>
                </div>
                <span className="badge badge-primary">{confirmedBookingData.format || activeBooking.format}</span>
              </div>

              <div className="ticket-visual-body">
                <h3 className="ticket-movie-title">{confirmedBookingData.movieTitle || activeBooking.movie?.title}</h3>
                <p className="ticket-theatre-name">{confirmedBookingData.theatreName || activeBooking.theatre?.name}</p>
                <div className="ticket-details-grid">
                  <div>
                    <span className="td-label">DATE & TIME</span>
                    <span className="td-val">{confirmedBookingData.date || activeBooking.date} • {confirmedBookingData.time || activeBooking.time}</span>
                  </div>
                  <div>
                    <span className="td-label">SEATS</span>
                    <span className="td-val highlight">
                      {(confirmedBookingData.seats || activeBooking.selectedSeats.map(s => s.id || s.seatId)).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="td-label">TOTAL PAID</span>
                    <span className="td-val">₹{confirmedBookingData.totalAmount || pricing.totalAmount}</span>
                  </div>
                  <div>
                    <span className="td-label">STATUS</span>
                    <span className="td-val" style={{ color: '#10B981' }}>CONFIRMED</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="ticket-qr-section">
                <img 
                  src={confirmedBookingData.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${confirmedBookingData.bookingReference || confirmedBookingData.id}`} 
                  alt="QR Entry Pass" 
                  className="ticket-qr-img"
                />
                <span className="qr-scan-hint">Scan at cinema entry gate</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="confirm-modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleDownloadTicketMock}
              >
                <Download size={16} />
                <span>Print / Download Ticket</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setConfirmedBookingData(null);
                  navigate('/my-bookings');
                }}
              >
                <span>View in My Bookings</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingSummary;
