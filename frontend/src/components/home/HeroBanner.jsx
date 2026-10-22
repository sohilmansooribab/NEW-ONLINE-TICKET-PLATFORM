import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Ticket, Film, ChevronLeft, ChevronRight, Play, Sparkles, Calendar, MapPin, Music } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import './HeroBanner.css';

// Rich promo slides highlighting movies and live entertainment events
const HERO_SLIDES = [
  {
    id: 'slide-1',
    type: 'movie',
    movieId: 'dune-2',
    title: 'Dune: Part Two',
    categoryTag: 'TRENDING #1 IN CINEMAS',
    formats: 'IMAX Laser 4K • 4DX • Dolby Atmos',
    rating: 8.8,
    duration: '2h 46m',
    genres: 'Sci-Fi • Action • Adventure',
    synopsis: 'Paul Atreides unites with Chani and the Fremen to lead a vengeful rebellion against the empire in this visually breathtaking cinematic tour de force.',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Book Tickets',
    ctaLink: '/theatres/dune-2',
    badge: 'CRITICS\' CHOICE'
  },
  {
    id: 'slide-2',
    type: 'event',
    eventId: 'evt-1',
    title: 'Diljit Dosanjh: Dil-Luminati Tour 2026',
    categoryTag: 'MEGA LIVE STADIUM CONCERT',
    formats: 'Live Arena Production • VIP Lounge Available',
    rating: 9.8,
    duration: 'Sat, 26 Oct • 7:00 PM',
    genres: 'Punjabi Pop • Live Concert • Delhi NCR',
    synopsis: 'The global sensation Diljit Dosanjh brings his monumental stadium tour to New Delhi. Expect electrifying dance anthems, laser visuals, and historic energy.',
    backdrop: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Book Concert Passes',
    ctaLink: '/#events',
    badge: 'SELLING FAST'
  },
  {
    id: 'slide-3',
    type: 'movie',
    movieId: 'jawan',
    title: 'Jawan',
    categoryTag: 'RECORD-BREAKING BLOCKBUSTER',
    formats: 'IMAX Laser 4K • 4DX • Dolby Atmos',
    rating: 8.4,
    duration: '2h 49m',
    genres: 'Action • Thriller • High-Voltage Drama',
    synopsis: 'Shah Rukh Khan delivers an electrifying performance in Atlee\'s explosive vigilante spectacle that shattered all-time global box office records.',
    backdrop: '/images/bollywood/jawan.jpg',
    ctaText: 'Book Tickets',
    ctaLink: '/theatres/jawan',
    badge: 'ALL-TIME HIT'
  },
  {
    id: 'slide-4',
    type: 'event',
    eventId: 'evt-2',
    title: 'Grand Navratri Dandiya Utsav 2026',
    categoryTag: 'FESTIVE CULTURAL CELEBRATION',
    formats: 'Live Folk Orchestra • Food Street • Family Zone',
    rating: 9.5,
    duration: '18 - 24 Oct • 8:00 PM',
    genres: 'Dandiya Raas • Garba • Live Music',
    synopsis: 'Celebrate the spirit of Navratri with vibrant Garba beats, celebrity singers, dazzling traditional lighting, and an unforgettable festive vibe in New Delhi.',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Get Festival Passes',
    ctaLink: '/#events',
    badge: 'POPULAR THIS WEEK'
  },
  {
    id: 'slide-5',
    type: 'movie',
    movieId: 'interstellar',
    title: 'Interstellar: 10th Anniversary',
    categoryTag: 'SPECIAL IMAX RE-RELEASE',
    formats: 'IMAX 70mm Laser • Dolby Atmos',
    rating: 8.7,
    duration: '2h 49m',
    genres: 'Sci-Fi • Adventure • Masterpiece',
    synopsis: 'Relive Christopher Nolan\'s emotional space odyssey on the giant screen as Cooper journeys through a wormhole to save humankind.',
    backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
    ctaText: 'Reserve IMAX Seats',
    ctaLink: '/theatres/interstellar',
    badge: 'LIMITED SCREENINGS'
  }
];

const HeroBanner = () => {
  const navigate = useNavigate();
  const { startBooking, showToast } = useBooking();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto slide every 5.5 seconds if not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentSlide = HERO_SLIDES[currentIndex];

  const handleActionClick = () => {
    if (currentSlide.type === 'movie') {
      navigate(currentSlide.ctaLink);
    } else {
      const el = document.getElementById('events-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast(`Passes for "${currentSlide.title}" are available below!`);
      }
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <section 
      className="hero-banner-root-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container hero-banner-container-white">
        <div className="hero-split-grid">
          {/* Left Column: Information & CTAs */}
          <div className="hero-info-column animate-fade-in" key={currentSlide.id}>
            {/* Top Badges */}
            <div className="hero-badge-strip">
              <span className="badge badge-primary hero-highlight-tag">
                <Sparkles size={12} /> {currentSlide.categoryTag}
              </span>
              <span className="badge badge-dark">
                {currentSlide.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="hero-movie-title-white">
              {currentSlide.title}
            </h1>

            {/* Meta Row */}
            <div className="hero-meta-row-white">
              <div className="hero-rating-box">
                <Star size={16} fill="#D97706" color="#D97706" />
                <span className="hero-rating-value">{currentSlide.rating}</span>
                <span className="hero-rating-scale">{currentSlide.type === 'movie' ? '/10 IMDb' : 'User Score'}</span>
              </div>
              <span className="hero-meta-dot">•</span>
              <div className="hero-duration-box">
                <Clock size={15} color="#6B7280" />
                <span>{currentSlide.duration}</span>
              </div>
              <span className="hero-meta-dot">•</span>
              <div className="hero-genre-tags">
                {currentSlide.genres}
              </div>
            </div>

            {/* Synopsis */}
            <p className="hero-synopsis-white">
              {currentSlide.synopsis}
            </p>

            {/* CTAs */}
            <div className="hero-actions-row">
              <button 
                type="button" 
                className="btn btn-primary btn-lg hero-cta-book"
                onClick={handleActionClick}
              >
                <Ticket size={18} />
                <span>{currentSlide.ctaText}</span>
              </button>
              {currentSlide.type === 'movie' ? (
                <Link 
                  to={`/movie/${currentSlide.movieId}`} 
                  className="btn btn-secondary btn-lg hero-cta-explore"
                >
                  <Film size={18} />
                  <span>View Details</span>
                </Link>
              ) : (
                <a 
                  href="#events-section" 
                  className="btn btn-secondary btn-lg hero-cta-explore"
                >
                  <Music size={18} />
                  <span>Explore Events</span>
                </a>
              )}
            </div>

            {/* Carousel Controls */}
            <div className="hero-carousel-nav">
              <div className="hero-carousel-dots">
                {HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="hero-carousel-arrows">
                <button 
                  type="button" 
                  className="carousel-arrow-btn" 
                  onClick={handlePrev}
                  aria-label="Previous Slide"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  type="button" 
                  className="carousel-arrow-btn" 
                  onClick={handleNext}
                  aria-label="Next Slide"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent Artwork Card */}
          <div className="hero-artwork-column">
            <div className="hero-artwork-card" key={`art-${currentSlide.id}`}>
              <img
                src={currentSlide.backdrop}
                alt={currentSlide.title}
                className="hero-artwork-img"
              />
              <div className="hero-artwork-overlay" />
              
              <div className="hero-artwork-footer">
                <div className="artwork-footer-meta">
                  <span className="artwork-formats-tag">
                    {currentSlide.formats}
                  </span>
                  <span className="artwork-languages-tag">
                    {currentSlide.type === 'movie' ? 'English • Hindi • Subtitles' : 'Live Arena Experience • All Ages'}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="artwork-trailer-btn"
                  onClick={handleActionClick}
                >
                  <div className="artwork-play-icon">
                    <Play size={15} fill="#FFFFFF" />
                  </div>
                  <span>{currentSlide.type === 'movie' ? 'Watch Trailer' : 'View Pass Info'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
