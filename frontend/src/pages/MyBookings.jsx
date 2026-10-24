import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ChevronRight,
  Printer
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import './MyBookings.css';

const MyBookings = () => {
  const { bookings, cancelBooking, refreshBookings, currentUser, showToast } = useBooking();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);
  const [cancelPromptId, setCancelPromptId] = useState(null);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const upcomingBookings = safeBookings.filter(b => 
    b && (b.status === 'CONFIRMED' || b.status === 'pending_payment' || b.status === 'PENDING')
  );
  const pastBookings = safeBookings.filter(b => 
    b && (b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'EXPIRED')
  );

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleCancelClick = async (id) => {
    await cancelBooking(id);
    setCancelPromptId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="my-bookings-root">
      <div className="container bookings-container">
        {/* Header */}
        <div className="bookings-header">
          <div>
            <span className="badge badge-primary header-badge">TICKETS & RESERVATIONS</span>
            <h1 className="bookings-page-title">My Bookings</h1>
            <p className="bookings-page-desc">
              Access your digital entry passes, booking history, and contactless cinema QR codes.
            </p>
          </div>

          {/* Tabs */}
          <div className="bookings-tabs-bar">
            <button
              className={`booking-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              className={`booking-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Past History ({pastBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {displayedBookings.length === 0 ? (
          <div className="no-bookings-card">
            <div className="no-bookings-icon">
              <Ticket size={48} color="#646777" />
            </div>
            <h3 className="no-bookings-title">
              {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings Found'}
            </h3>
            <p className="no-bookings-desc">
              {activeTab === 'upcoming' 
                ? "You don't have any movie tickets booked yet. Explore current blockbusters and grab your seats!"
                : "Your completed and past screening records will appear here."}
            </p>
            <Link to="/movies" className="btn btn-primary">
              Browse Movies Now
            </Link>
          </div>
        ) : (
          <div className="bookings-cards-stack">
            {displayedBookings.map((b) => (
              <div key={b.id} className="cinema-ticket-card">
                {/* Left Poster Pane */}
                <div className="ticket-poster-side">
                  <img src={b.moviePoster} alt={b.movieTitle} className="ticket-poster-img" />
                  <span className={`ticket-status-tag status-${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>
                </div>

                {/* Perforated Divider */}
                <div className="ticket-perforation">
                  <div className="punch-hole top" />
                  <div className="perf-line" />
                  <div className="punch-hole bottom" />
                </div>

                {/* Center Ticket Info */}
                <div className="ticket-info-center">
                  <div className="ticket-head">
                    <span className="ticket-ref-code">REF: {b.id}</span>
                    <span className="ticket-format-pill">{b.format}</span>
                  </div>

                  <h3 className="ticket-title">{b.movieTitle}</h3>

                  <div className="ticket-meta-grid">
                    <div className="meta-cell">
                      <span className="meta-label">THEATRE</span>
                      <span className="meta-text">{b.theatreName}</span>
                      <span className="meta-subtext">{b.screenName}</span>
                    </div>

                    <div className="meta-cell">
                      <span className="meta-label">DATE & TIME</span>
                      <span className="meta-text">{b.date}</span>
                      <span className="meta-subtext">{b.time}</span>
                    </div>

                    <div className="meta-cell">
                      <span className="meta-label">SEATS</span>
                      <span className="meta-text highlight">{Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || '')}</span>
                      <span className="meta-subtext">{b.seatTier}</span>
                    </div>

                    <div className="meta-cell">
                      <span className="meta-label">TOTAL PAID</span>
                      <span className="meta-text">₹{b.totalAmount}</span>
                      <span className="meta-subtext">{b.ticketCount} Tickets</span>
                    </div>
                  </div>

                  <div className="ticket-actions-bar">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedTicketModal(b)}
                    >
                      <QrCode size={16} />
                      <span>View E-Ticket & QR</span>
                    </button>

                    {b.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm ticket-cancel-btn"
                        onClick={() => setCancelPromptId(b.id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>

                {/* Right QR Code Thumbnail */}
                <div className="ticket-qr-side">
                  <img src={b.qrCode} alt="Entry QR" className="ticket-qr-thumbnail" />
                  <span className="ticket-qr-label">Contactless Entry</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View E-Ticket Modal */}
      {selectedTicketModal && (
        <div className="ticket-modal-backdrop" onClick={() => setSelectedTicketModal(null)}>
          <div className="printable-ticket-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={() => setSelectedTicketModal(null)}
            >
              <X size={20} />
            </button>

            <div className="ticket-modal-header">
              <span className="badge badge-primary">DIGITAL BOARDING PASS</span>
              <h2 className="modal-ticket-movie">{selectedTicketModal.movieTitle}</h2>
              <p className="modal-ticket-theatre">
                {selectedTicketModal.theatreName} • {selectedTicketModal.screenName}
              </p>
            </div>

            <div className="ticket-perforation-horizontal">
              <div className="punch-hole left" />
              <div className="perf-line-h" />
              <div className="punch-hole right" />
            </div>

            <div className="modal-ticket-body">
              <div className="modal-ticket-info-grid">
                <div>
                  <span className="label">BOOKING ID</span>
                  <span className="val highlight">{selectedTicketModal.id}</span>
                </div>
                <div>
                  <span className="label">FORMAT</span>
                  <span className="val">{selectedTicketModal.format}</span>
                </div>
                <div>
                  <span className="label">DATE</span>
                  <span className="val">{selectedTicketModal.date}</span>
                </div>
                <div>
                  <span className="label">TIME</span>
                  <span className="val">{selectedTicketModal.time}</span>
                </div>
                <div>
                  <span className="label">SEATS</span>
                  <span className="val highlight">{Array.isArray(selectedTicketModal.seats) ? selectedTicketModal.seats.join(', ') : (selectedTicketModal.seats || '')}</span>
                </div>
                <div>
                  <span className="label">AMOUNT</span>
                  <span className="val">₹{selectedTicketModal.totalAmount}</span>
                </div>
              </div>

              <div className="modal-qr-box">
                <img src={selectedTicketModal.qrCode} alt="QR Code" className="modal-qr-image" />
                <p className="modal-qr-instruction">
                  Present this QR code directly at the auditorium gate scanner.
                </p>
              </div>
            </div>

            <div className="modal-ticket-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handlePrint}
              >
                <Printer size={16} />
                <span>Print Ticket</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  showToast('E-Ticket saved to device!');
                  setSelectedTicketModal(null);
                }}
              >
                <Download size={16} />
                <span>Save to Wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Prompt */}
      {cancelPromptId && (
        <div className="ticket-modal-backdrop" onClick={() => setCancelPromptId(null)}>
          <div className="cancel-confirm-box animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-icon-circle">
              <AlertTriangle size={32} color="#EF4444" />
            </div>
            <h3 className="cancel-confirm-title">Cancel this Booking?</h3>
            <p className="cancel-confirm-desc">
              Are you sure you want to cancel booking <strong>{cancelPromptId}</strong>? As per the multiplex policy, an instant demo refund will be credited to your account.
            </p>
            <div className="cancel-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setCancelPromptId(null)}
              >
                Keep Booking
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                onClick={() => handleCancelClick(cancelPromptId)}
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
