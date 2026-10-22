import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Ticket, Clock, Eye, Calendar } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import './MovieCard.css';

const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { startBooking } = useBooking();
  const [imgSrc, setImgSrc] = useState(movie.poster || fallbackPoster);

  useEffect(() => {
    setImgSrc(movie.poster || fallbackPoster);
  }, [movie.poster]);

  const isComingSoon = movie.tags?.includes('coming-soon');
  const isBookingSupported = !isComingSoon;
  const movieId = movie.slug || movie.id || movie._id;

  const handleBookNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBookingSupported) return;
    startBooking(movie);
    navigate(`/theatres/${movieId}`);
  };

  const handleCardClick = () => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="movie-card" onClick={handleCardClick} role="button" tabIndex={0}>
      {/* Poster Container */}
      <div className="movie-card-poster-wrap">
        <img
          src={imgSrc}
          alt={movie.title}
          className="movie-card-poster"
          loading="lazy"
          onError={() => setImgSrc(fallbackPoster)}
        />

        {/* Top Badges */}
        <div className="poster-top-badges">
          {movie.formats && movie.formats[0] && (
            <span className="badge badge-dark poster-format-badge">
              {movie.formats[0]}
            </span>
          )}
          {(movie.certificate || movie.certification) && (
            <span className="badge badge-dark poster-cert-badge">
              {movie.certificate || movie.certification}
            </span>
          )}
        </div>

        {/* Rating Floating Pill */}
        <div className="poster-rating-pill">
          <Star size={13} fill="#F59E0B" color="#F59E0B" />
          <span className="rating-score">{movie.rating.toFixed(1)}</span>
          {movie.voteCount && <span className="rating-votes">({movie.voteCount})</span>}
        </div>

        {/* Hover Overlay with Action Buttons */}
        <div className="poster-hover-overlay">
          <div className="poster-overlay-content">
            <span className="overlay-duration">
              <Clock size={13} /> {movie.duration}
            </span>
            <div className="overlay-actions">
              {isBookingSupported ? (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm overlay-book-btn"
                  onClick={handleBookNow}
                >
                  <Ticket size={14} />
                  <span>Book Tickets</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm overlay-book-btn disabled"
                  disabled
                >
                  <Clock size={14} />
                  <span>Coming Soon</span>
                </button>
              )}
              <Link 
                to={`/movie/${movie.id}`} 
                className="btn btn-secondary btn-sm overlay-details-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={14} />
                <span>Details</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="movie-card-info">
        <h3 className="movie-card-title" title={movie.title}>
          {movie.title}
        </h3>
        
        <div className="movie-card-meta">
          <span className="movie-card-genres">
            {movie.genres ? movie.genres.slice(0, 2).join(' • ') : 'Action'}
          </span>
          {movie.releaseDate && (
            <span className="movie-card-release" title={`Release: ${movie.releaseDate}`}>
              <Calendar size={12} className="meta-cal-icon" />
              <span>{movie.releaseDate}</span>
            </span>
          )}
        </div>

        <div className="movie-card-footer">
          <span className="movie-card-languages">
            {movie.languages ? movie.languages.slice(0, 2).join(', ') : 'English'}
          </span>
          {movie.priceStartingAt && (
            <span className="movie-card-price">
              From ₹{movie.priceStartingAt}
            </span>
          )}
        </div>

        {/* Action Button Row */}
        <div className="movie-card-action-bar">
          {isBookingSupported ? (
            <button
              type="button"
              className="card-book-tickets-btn"
              onClick={handleBookNow}
              title="Book Tickets for this movie"
            >
              <Ticket size={14} />
              <span>Book Tickets</span>
            </button>
          ) : (
            <div className="card-upcoming-pill">
              <Clock size={12} />
              <span>Premieres {movie.releaseDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
