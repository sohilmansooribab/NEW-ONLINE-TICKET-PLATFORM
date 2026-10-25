import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Armchair, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Film,
  Loader2
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { showtimesApi, bookingsApi } from '../services/api';
import './SelectSeats.css';

const FALLBACK_SEAT_ROWS = [
  { row: 'A', tier: 'VIP Recliner', price: 520, seatsCount: 12 },
  { row: 'B', tier: 'VIP Recliner', price: 520, seatsCount: 12 },
  { row: 'C', tier: 'Premium', price: 380, seatsCount: 16 },
  { row: 'D', tier: 'Premium', price: 380, seatsCount: 16 },
  { row: 'E', tier: 'Premium', price: 380, seatsCount: 16 },
  { row: 'F', tier: 'Premium', price: 380, seatsCount: 16 },
  { row: 'G', tier: 'Classic', price: 280, seatsCount: 18 },
  { row: 'H', tier: 'Classic', price: 280, seatsCount: 18 },
  { row: 'J', tier: 'Classic', price: 280, seatsCount: 18 },
];

const FALLBACK_OCCUPIED = new Set(['A5', 'A6', 'C7', 'C8', 'D4', 'D5', 'D6', 'F9', 'F10', 'H3', 'H4', 'J11', 'J12']);

const SelectSeats = () => {
  const navigate = useNavigate();
  const { theatreId: routeParam } = useParams();
  const { 
    activeBooking, 
    currentUser, 
    toggleSeat, 
    calculatePricing, 
    updateBookingState, 
    showToast 
  } = useBooking();

  const [liveSeatRows, setLiveSeatRows] = useState(null);
  const [occupiedSeatsSet, setOccupiedSeatsSet] = useState(FALLBACK_OCCUPIED);
  const [heldSeatsSet, setHeldSeatsSet] = useState(new Set());
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [activeShowtimeId, setActiveShowtimeId] = useState(null);

  const selectedSeats = activeBooking.selectedSeats || [];
  const selectedSeatIds = useMemo(() => new Set(selectedSeats.map(s => s.id || s.seatId)), [selectedSeats]);

  const pricing = calculatePricing();

  const loadSeats = useCallback(async (stId) => {
    try {
      setIsLoading(true);
      const res = await showtimesApi.getShowtimeSeats(stId);
      const rows = res.rows || res.seatMap;
      if (res && rows) {
        setLiveSeatRows(rows);
        setActiveShowtimeId(stId);

        const occupied = new Set(res.occupiedSeatIds || []);
        const held = new Set(res.heldSeatIds || []);
        const allSeatsList = res.seats || res.allSeats || [];
        allSeatsList.forEach(s => {
          if (s.status === 'occupied' || s.isBooked) occupied.add(s.id || s.seatId);
          if (s.status === 'held' || s.isHeld) held.add(s.id || s.seatId);
        });
        setOccupiedSeatsSet(occupied);
        setHeldSeatsSet(held);
        setIsLiveApi(true);

        if (res.showtime && !activeBooking.showtime) {
          updateBookingState({
            showtime: res.showtime,
            theatre: res.theatre || activeBooking.theatre,
            screen: res.screen || activeBooking.screen,
            movie: res.movie || activeBooking.movie,
          });
        }
      }
    } catch (err) {
      console.warn('Backend live seat map unavailable, using auditorium layout template:', err.message);
      setIsLiveApi(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeBooking.showtime, activeBooking.theatre, activeBooking.screen, activeBooking.movie, updateBookingState]);

  useEffect(() => {

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(routeParam);
    const targetId = activeBooking.showtimeId || activeBooking.showtime?._id || (isObjectId ? routeParam : null);

    if (targetId) {
      loadSeats(targetId);
    } else {

      showtimesApi.getShowtimes({ limit: 10 })
        .then(res => {
          if (res?.data && res.data.length > 0) {
            const firstShow = res.data[0];
            loadSeats(firstShow._id);
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => setIsLoading(false));
    }
  }, [routeParam, activeBooking.showtimeId, activeBooking.showtime?._id, loadSeats]);

  const handleSeatClick = (seatObj) => {
    const seatId = seatObj.id || seatObj.seatId;
    if (occupiedSeatsSet.has(seatId)) {
      showToast('This seat is already booked by another moviegoer.', 'warning');
      return;
    }
    if (heldSeatsSet.has(seatId) && !selectedSeatIds.has(seatId)) {
      showToast('This seat is currently held by someone checking out. Please choose an available seat.', 'warning');
      return;
    }
    toggleSeat(seatObj);
  };

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      showToast('Please select at least 1 seat to proceed.', 'error');
      return;
    }

    if (!currentUser) {
      showToast('Please sign in to reserve your seats.', 'warning');
      navigate('/login');
      return;
    }

    if (activeShowtimeId) {
      setIsHolding(true);
      try {
        const holdRes = await bookingsApi.holdSeats({
          showtimeId: activeShowtimeId,
          seats: selectedSeats.map(s => s.id || s.seatId),
          durationSeconds: 300,
          promoCode: activeBooking.appliedPromo?.code,
        });

        if (holdRes?.success) {
          updateBookingState({
            hold: {
              holdId: holdRes.holdId,
              expiresAt: holdRes.expiresAt,
              expiresInSeconds: holdRes.expiresInSeconds,
            },
            authoritativePricing: holdRes.pricing,
          });

          showToast('Seats reserved successfully for 5 minutes!', 'success');
          navigate('/booking-summary');
          return;
        }
      } catch (err) {
        if (err.status === 409) {
          showToast('One or more selected seats were just claimed by another user. Updating seat layout...', 'error');
          loadSeats(activeShowtimeId);
        } else {
          showToast(err.message || 'Seat hold error. Please retry.', 'error');
        }
        setIsHolding(false);
        return;
      }
    }

    navigate('/booking-summary');
  };

  return (
    <div className="select-seats-root">

      <div className="seats-top-bar">
        <div className="container seats-top-content">
          <button 
            type="button" 
            className="btn btn-ghost btn-sm seats-back-btn"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={18} />
            <span>Change Showtime</span>
          </button>

          <div className="seats-booking-summary-header">
            <h2 className="header-movie-title">{activeBooking.movie?.title || 'Dune: Part Two'}</h2>
            <p className="header-theatre-info">
              {activeBooking.theatre?.name || 'PVR Cinemas'} • {activeBooking.format || 'IMAX 3D'} • {activeBooking.date || 'Today'} at {activeBooking.time || '06:15 PM'}
            </p>
          </div>

          <div className="seats-ticket-counter">
            <span className="counter-label">Selected:</span>
            <span className="counter-value">{selectedSeats.length} / 8</span>
          </div>
        </div>
      </div>

      <div className="container seats-main-layout">

        <div className="seats-auditorium-container">

          <div className="cinema-screen-wrap">
            <div className="screen-curve-glow" />
            <div className="screen-curve-bar" />
            <div className="screen-text">
              <span>ALL EYES THIS WAY (SCREEN)</span>
            </div>
          </div>

          <div className="seat-grid-scroll-box">
            <div className="seat-grid-canvas">
              {liveSeatRows ? (

                liveSeatRows.map((rowItem, rIdx) => {
                  const prevRow = liveSeatRows[rIdx - 1];
                  const showTierHeader = !prevRow || prevRow.tier !== rowItem.tier;

                  return (
                    <React.Fragment key={rowItem.row}>
                      {showTierHeader && (
                        <div className="tier-header-divider">
                          <span className="tier-name">{rowItem.tier}</span>
                          <span className="tier-price">₹{rowItem.price}</span>
                        </div>
                      )}

                      <div className="seat-row-line">
                        <span className="row-letter">{rowItem.row}</span>

                        <div className="seats-row-group">
                          {rowItem.seats.map((seat, i) => {
                            const seatId = seat.id || seat.seatId;
                            const isOccupied = occupiedSeatsSet.has(seatId);
                            const isHeld = heldSeatsSet.has(seatId) && !selectedSeatIds.has(seatId);
                            const isSelected = selectedSeatIds.has(seatId);
                            const isAisleGap = (rowItem.seats.length > 12 && (i === 3 || i === rowItem.seats.length - 4));

                            return (
                              <React.Fragment key={seatId}>
                                <button
                                  type="button"
                                  className={`seat-item tier-${(seat.tier || 'standard').toLowerCase().replace(/\s+/g, '-')} ${isOccupied ? 'occupied' : isHeld ? 'held' : isSelected ? 'selected' : 'available'}`}
                                  onClick={() => handleSeatClick({ id: seatId, seatId, row: seat.row, tier: seat.tier, price: seat.price })}
                                  disabled={isOccupied || isHeld}
                                  aria-label={`Seat ${seatId}, ${seat.tier}, ₹${seat.price}`}
                                  title={`Seat ${seatId} (${seat.tier} - ₹${seat.price}${isHeld ? ' [Held]' : ''})`}
                                >
                                  <span className="seat-number">{seat.number}</span>
                                </button>
                                {isAisleGap && <div className="aisle-gap" />}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        <span className="row-letter">{rowItem.row}</span>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (

                FALLBACK_SEAT_ROWS.map((rowItem, rIdx) => {
                  const prevRow = FALLBACK_SEAT_ROWS[rIdx - 1];
                  const showTierHeader = !prevRow || prevRow.tier !== rowItem.tier;

                  return (
                    <React.Fragment key={rowItem.row}>
                      {showTierHeader && (
                        <div className="tier-header-divider">
                          <span className="tier-name">{rowItem.tier}</span>
                          <span className="tier-price">₹{rowItem.price}</span>
                        </div>
                      )}

                      <div className="seat-row-line">
                        <span className="row-letter">{rowItem.row}</span>

                        <div className="seats-row-group">
                          {Array.from({ length: rowItem.seatsCount }, (_, i) => {
                            const colNum = i + 1;
                            const seatId = `${rowItem.row}${colNum}`;
                            const isOccupied = occupiedSeatsSet.has(seatId);
                            const isSelected = selectedSeatIds.has(seatId);
                            const isAisleGap = (rowItem.seatsCount === 16 && (colNum === 4 || colNum === 12)) ||
                                              (rowItem.seatsCount === 12 && (colNum === 3 || colNum === 9)) ||
                                              (rowItem.seatsCount === 18 && (colNum === 5 || colNum === 13));

                            const seatObj = {
                              id: seatId,
                              seatId,
                              row: rowItem.row,
                              col: colNum,
                              tier: rowItem.tier,
                              price: rowItem.price
                            };

                            return (
                              <React.Fragment key={seatId}>
                                <button
                                  type="button"
                                  className={`seat-item tier-${rowItem.tier.toLowerCase().replace(/\s+/g, '-')} ${isOccupied ? 'occupied' : isSelected ? 'selected' : 'available'}`}
                                  onClick={() => handleSeatClick(seatObj)}
                                  disabled={isOccupied}
                                  aria-label={`Seat ${seatId}, ${rowItem.tier}, ₹${rowItem.price}`}
                                  title={`Seat ${seatId} (${rowItem.tier} - ₹${rowItem.price})`}
                                >
                                  <span className="seat-number">{colNum}</span>
                                </button>
                                {isAisleGap && <div className="aisle-gap" />}
                              </React.Fragment>
                            );
                          })}
                        </div>

                        <span className="row-letter">{rowItem.row}</span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          <div className="seats-legend-bar">
            <div className="legend-entry">
              <div className="legend-seat-sample available" />
              <span>Available</span>
            </div>
            <div className="legend-entry">
              <div className="legend-seat-sample selected" />
              <span>Selected</span>
            </div>
            <div className="legend-entry">
              <div className="legend-seat-sample occupied" />
              <span>Occupied</span>
            </div>
            <div className="legend-divider" />
            <div className="legend-entry">
              <span className="tier-dot vip" />
              <span>VIP Recliner (₹520)</span>
            </div>
            <div className="legend-entry">
              <span className="tier-dot premium" />
              <span>Premium (₹380)</span>
            </div>
            <div className="legend-entry">
              <span className="tier-dot classic" />
              <span>Classic (₹280)</span>
            </div>
          </div>
        </div>

        <div className="seats-summary-sidebar">
          <div className="summary-card">
            <h3 className="summary-card-title">Booking Details</h3>

            <div className="summary-movie-info">
              <h4 className="sum-title">{activeBooking.movie?.title || 'Selected Movie'}</h4>
              <p className="sum-theatre">{activeBooking.theatre?.name || 'PVR Cinemas'}</p>
              <p className="sum-datetime">
                {(activeBooking.date || 'Today')} • {(activeBooking.time || '06:15 PM')}
              </p>
              <div className="sum-badges">
                <span className="badge badge-primary">{activeBooking.format || 'IMAX 3D'}</span>
                <span className="badge badge-dark">{activeBooking.screen?.name || 'Screen 1'}</span>
                {isLiveApi && (
                  <span className="badge badge-gold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Live Seat Sync
                  </span>
                )}
              </div>
            </div>

            <div className="summary-divider" />

            <div className="selected-seats-block">
              <div className="flex-between">
                <span className="selected-seats-label">Selected Seats</span>
                <span className="badge badge-dark">{selectedSeats.length} Seats</span>
              </div>

              {selectedSeats.length === 0 ? (
                <div className="no-seats-selected-placeholder">
                  <Armchair size={28} color="#646777" />
                  <p>Click on available seats on the map to add them to your booking.</p>
                </div>
              ) : (
                <div className="selected-seats-chips-wrap">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id || seat.seatId} className="selected-seat-chip">
                      <span className="chip-seat-id">{seat.id || seat.seatId}</span>
                      <span className="chip-seat-tier">{seat.tier}</span>
                      <span className="chip-seat-price">₹{seat.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="summary-divider" />

            <div className="pricing-breakdown-list">
              <div className="pricing-row">
                <span className="price-label">Tickets Subtotal</span>
                <span className="price-val">₹{pricing.baseTotal}</span>
              </div>
              <div className="pricing-row">
                <span className="price-label">Convenience Fee (12% incl. GST)</span>
                <span className="price-val">₹{pricing.convenienceFee}</span>
              </div>
              <div className="pricing-total-row">
                <span className="total-label">Estimated Total</span>
                <span className="total-amount">₹{pricing.totalAmount}</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary btn-lg seats-proceed-btn"
              onClick={handleProceed}
              disabled={selectedSeats.length === 0 || isHolding}
            >
              {isHolding ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Reserving Seats...</span>
                </>
              ) : (
                <>
                  <span>Continue to Summary</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="secure-badge-note">
              <ShieldCheck size={14} color="#10B981" />
              <span>Seats reserved temporarily for 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectSeats;
