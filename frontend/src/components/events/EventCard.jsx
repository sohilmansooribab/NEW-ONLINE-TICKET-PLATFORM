import React from 'react';
import { Calendar, MapPin, Ticket, Sparkles, Music, Flame, Smile, Zap } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import './EventCard.css';

const iconMap = {
  Music: Music,
  Sparkles: Sparkles,
  Flame: Flame,
  Smile: Smile,
  Zap: Zap
};

const EventCard = ({ event }) => {
  const { showToast } = useBooking();

  const IconComp = iconMap[event.categoryIcon] || Sparkles;

  const handleBookPass = (e) => {
    e.preventDefault();
    showToast(`Passes for "${event.title}" selected! Demo booking confirmed.`);
  };

  return (
    <div className="event-card">
      <div className="event-poster-wrap">
        <img src={event.poster} alt={event.title} className="event-poster-img" loading="lazy" />
        
        {/* Category Pill */}
        <div className="event-top-badge">
          <span className="badge badge-primary event-category-badge">
            <IconComp size={12} />
            <span>{event.category}</span>
          </span>
        </div>

        {event.badge && (
          <div className="event-special-tag">
            <span>{event.badge}</span>
          </div>
        )}
      </div>

      <div className="event-info-body">
        <h3 className="event-title" title={event.title}>{event.title}</h3>
        
        <div className="event-meta-line">
          <Calendar size={13} className="event-meta-icon" />
          <span>{event.date}</span>
        </div>

        <div className="event-meta-line">
          <MapPin size={13} className="event-meta-icon" />
          <span className="event-venue-text">{event.venue}</span>
        </div>

        <p className="event-desc-snippet">{event.description}</p>

        <div className="event-footer-bar">
          <div className="event-price-box">
            <span className="event-price-label">Starts at</span>
            <span className="event-price-val">₹{event.priceStartingAt}</span>
          </div>

          <button 
            type="button" 
            className="btn btn-primary btn-sm event-book-btn"
            onClick={handleBookPass}
          >
            <Ticket size={14} />
            <span>Book Passes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
