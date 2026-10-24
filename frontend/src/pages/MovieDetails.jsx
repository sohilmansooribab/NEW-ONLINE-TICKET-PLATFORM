import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, 
  Clock, 
  Calendar, 
  Film, 
  Ticket, 
  Play, 
  Share2, 
  Heart, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  X,
  Loader2
} from 'lucide-react';
import { MOVIES, THEATRES } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { moviesApi } from '../services/api';
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startBooking, showToast } = useBooking();

  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [movie, setMovie] = useState(() => MOVIES.find((m) => m.id === id || m.slug === id || m._id === id) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    moviesApi
      .getMovie(id)
      .then((res) => {
        if (isMounted && res?.data) {
          setMovie(res.data);
        }
      })
      .catch((err) => {
        console.warn('Backend movie detail error, falling back:', err.message);
        // Fallback to local catalogue if not already found
        if (isMounted) {
          setMovie((prev) => prev || MOVIES.find((m) => m.id === id || m.slug === id || m._id === id) || MOVIES[0]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading && !movie) {
    return (
      <div className="movie-details-root" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#646777' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#E63946' }} />
          <p>Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-details-root" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Film size={48} style={{ color: '#E63946', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>Movie Not Found</h2>
          <p style={{ color: '#646777', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            The requested movie could not be located. It might have been updated or removed from the active screening list.
          </p>
          <Link to="/movies" className="btn btn-primary">
            Browse All Movies
          </Link>
        </div>
      </div>
    );
  }

  const movieId = movie.slug || movie.id || movie._id;
  const ratingVal = typeof movie.rating === 'number' ? movie.rating.toFixed(1) : (movie.rating || '8.5');
  const durationText = movie.duration || (movie.durationMinutes ? `${Math.floor(movie.durationMinutes / 60)}h ${movie.durationMinutes % 60}m` : '2h 15m');
  const releaseStr = movie.releaseDate 
    ? (typeof movie.releaseDate === 'string' && movie.releaseDate.length > 10 ? new Date(movie.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : movie.releaseDate)
    : 'Now Showing';
  const synopsisText = movie.description || movie.synopsis || 'Experience this cinematic masterpiece in premier sound and laser projection at top multiplex auditoriums.';
  const genresList = Array.isArray(movie.genres) ? movie.genres : ['Action', 'Drama'];
  const languagesList = Array.isArray(movie.languages) ? movie.languages : ['Hindi', 'English'];

  const handleBookTickets = () => {
    startBooking(movie);
    navigate(`/theatres/${movieId}`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Movie link copied to clipboard!');
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    showToast(!isWishlisted ? 'Added to your Watchlist' : 'Removed from Watchlist');
  };

  return (
    <div className="movie-details-root">
      {/* Backdrop Header Hero */}
      <div className="details-hero">
        <div 
          className="details-backdrop"
          style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
        />
        <div className="details-backdrop-overlay" />
        <div className="details-backdrop-bottom-fade" />

        <div className="container details-hero-content">
          {/* Breadcrumbs */}
          <div className="breadcrumbs-wrap">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/movies">Movies</Link>
            <ChevronRight size={14} />
            <span>{movie.title}</span>
          </div>

          <div className="details-grid">
            {/* Poster Card */}
            <div className="details-poster-card">
              <img 
                src={movie.poster} 
                alt={movie.title} 
                className="details-poster-img"
              />
              <button 
                type="button" 
                className="trailer-play-overlay-btn"
                onClick={() => setIsTrailerOpen(true)}
              >
                <div className="play-icon-circle">
                  <Play size={24} fill="#FFFFFF" />
                </div>
                <span>Watch Trailer</span>
              </button>
            </div>

            {/* Movie Info */}
            <div className="details-info-pane">
              {/* Badges */}
              <div className="details-badges">
                <span className="badge badge-primary">{movie.certificate || movie.certification || 'U/A'}</span>
                {movie.formats?.map((fmt, i) => (
                  <span key={i} className="badge badge-dark">{fmt}</span>
                ))}
                {movie.heroTag && (
                  <span className="badge badge-gold">
                    <Sparkles size={12} /> {movie.heroTag}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="details-title">{movie.title}</h1>

              {/* Meta Row */}
              <div className="details-meta-row">
                <div className="details-rating-badge">
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <span className="details-rating-val">{ratingVal}</span>
                  <span className="details-rating-scale">/10</span>
                  <span className="details-votes">({movie.voteCount || '10K+'} Votes)</span>
                </div>

                <div className="meta-separator" />

                <div className="details-meta-item">
                  <Clock size={16} />
                  <span>{durationText}</span>
                </div>

                <div className="meta-separator" />

                <div className="details-meta-item">
                  <Calendar size={16} />
                  <span>{releaseStr}</span>
                </div>
              </div>

              {/* Languages & Formats */}
              <div className="details-specs-row">
                <div className="spec-item">
                  <span className="spec-label">Languages:</span>
                  <span className="spec-value">{languagesList.join(', ')}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Genres:</span>
                  <span className="spec-value">{genresList.join(', ')}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Director:</span>
                  <span className="spec-value highlight">{movie.director || 'Acclaimed Filmmaker'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="details-actions-bar">
                <button 
                  type="button" 
                  className="btn btn-primary btn-lg book-main-cta"
                  onClick={handleBookTickets}
                >
                  <Ticket size={20} />
                  <span>Book Tickets</span>
                </button>

                <button 
                  type="button" 
                  className={`btn btn-secondary btn-lg ${isWishlisted ? 'active-wishlist' : ''}`}
                  onClick={toggleWishlist}
                  title="Add to Watchlist"
                >
                  <Heart size={18} fill={isWishlisted ? '#E63946' : 'none'} color={isWishlisted ? '#E63946' : 'currentColor'} />
                  <span>{isWishlisted ? 'Watchlisted' : 'Watchlist'}</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-icon"
                  onClick={handleShare}
                  title="Share Movie"
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Synopsis */}
              <div className="details-synopsis-section">
                <h3 className="section-subtitle">Synopsis</h3>
                <p className="details-synopsis-text">{synopsisText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Crew Section */}
      <div className="container details-bottom-sections">
        <section className="cast-section">
          <div className="section-title-wrap" style={{ marginBottom: '1.5rem' }}>
            <span className="section-tagline">STARRING TALENT</span>
            <h2 className="section-title">Cast & Crew</h2>
          </div>

          <div className="cast-grid">
            {movie.cast?.map((member, idx) => (
              <div key={idx} className="cast-card">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="cast-avatar"
                />
                <h4 className="cast-name">{member.name}</h4>
                <p className="cast-role">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Multiplex Availability Preview */}
        <section className="available-screens-preview">
          <div className="section-title-wrap" style={{ marginBottom: '1.5rem' }}>
            <span className="section-tagline">NOW SHOWING AT</span>
            <h2 className="section-title">Top Multiplexes</h2>
          </div>

          <div className="theatres-quick-list">
            {THEATRES.slice(0, 3).map((theatre) => (
              <div key={theatre.id} className="theatre-quick-card">
                <div className="theatre-quick-info">
                  <h4 className="theatre-quick-title">{theatre.name}</h4>
                  <p className="theatre-quick-sub">{theatre.location} • {theatre.distance}</p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={handleBookTickets}
                >
                  Select Showtime
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Trailer Modal Demo */}
      {isTrailerOpen && (
        <div className="trailer-modal-backdrop" onClick={() => setIsTrailerOpen(false)}>
          <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="trailer-close-btn"
              onClick={() => setIsTrailerOpen(false)}
            >
              <X size={20} />
            </button>
            <div className="trailer-video-box">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube-nocookie.com/embed/Way9Dexny3w?autoplay=1"
                title={`${movie.title} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
