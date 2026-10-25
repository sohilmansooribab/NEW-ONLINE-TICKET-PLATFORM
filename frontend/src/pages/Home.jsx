import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Flame, 
  Sparkles, 
  Clock, 
  Calendar, 
  Heart, 
  Gem, 
  Music, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Armchair, 
  ArrowRight, 
  Award,
  CheckCircle2,
  Info,
  Film,
  Globe,
  Clapperboard
} from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import MovieCarousel from '../components/home/MovieCarousel';
import MovieCard from '../components/movies/MovieCard';
import EventCard from '../components/events/EventCard';
import GenreFilter from '../components/movies/GenreFilter';
import { MOVIES, BOLLYWOOD_MOVIES, HOLLYWOOD_MOVIES, THEATRES, CITIES, ENTERTAINMENT_EVENTS } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { isLiveDataConnected } from '../services/tmdbService';
import { moviesApi } from '../services/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { selectedCity, setSelectedCity } = useBooking();
  const [activeGenre, setActiveGenre] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all'); 
  const [liveMovies, setLiveMovies] = useState([]);
  const [isApiLive, setIsApiLive] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    moviesApi.getMovies({ limit: 50 })
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setLiveMovies(res.data);
          setIsApiLive(true);
        }
      })
      .catch((err) => {
        console.warn('Backend Movies API unavailable, using curated catalogue:', err.message);
        if (isMounted) setApiError(err.message);
      });

    return () => { isMounted = false; };
  }, []);

  const baseMovies = liveMovies.length > 0 ? liveMovies : MOVIES;
  const bollywoodMovies = liveMovies.length > 0 
    ? liveMovies.filter(m => m.industry === 'bollywood') 
    : BOLLYWOOD_MOVIES;
  const hollywoodMovies = liveMovies.length > 0 
    ? liveMovies.filter(m => m.industry === 'hollywood') 
    : HOLLYWOOD_MOVIES;

  const trendingFiltered = baseMovies.filter(m => m.tags?.includes('trending'));
  const trendingNow = trendingFiltered.length > 0 ? trendingFiltered : MOVIES.filter(m => m.tags?.includes('trending'));

  const popularFiltered = baseMovies.filter(m => m.tags?.includes('popular'));
  const popularThisWeek = popularFiltered.length > 0 ? popularFiltered : MOVIES.filter(m => m.tags?.includes('popular'));

  const newReleasesFiltered = baseMovies.filter(m => m.tags?.includes('new-releases') || m.status === 'released');
  const newReleases = newReleasesFiltered.length > 0 ? newReleasesFiltered : MOVIES.filter(m => m.tags?.includes('new-releases'));

  const comingSoonFiltered = baseMovies.filter(m => m.tags?.includes('coming-soon') || m.status === 'upcoming');
  const comingSoon = comingSoonFiltered.length > 0 ? comingSoonFiltered : MOVIES.filter(m => m.tags?.includes('coming-soon'));

  const audienceFiltered = baseMovies.filter(m => m.tags?.includes('audience-favourite') || (m.rating && m.rating >= 8.5));
  const audienceFavourites = audienceFiltered.length > 0 ? audienceFiltered : MOVIES.filter(m => m.tags?.includes('audience-favourite'));

  const gemsFiltered = baseMovies.filter(m => m.tags?.includes('hidden-gems'));
  const hiddenGems = gemsFiltered.length > 0 ? gemsFiltered : MOVIES.filter(m => m.tags?.includes('hidden-gems'));

  const cityName = CITIES.find(c => c.id === selectedCity)?.name || 'Delhi-NCR';

  const filteredDiscovery = (
    activeCategory === 'bollywood' 
      ? bollywoodMovies 
      : activeCategory === 'hollywood' 
      ? hollywoodMovies 
      : baseMovies
  ).filter(m => {
    if (activeGenre !== 'all') {
      const matchGenre = m.genres?.some(g => g.toLowerCase() === activeGenre.toLowerCase());
      if (!matchGenre) return false;
    }
    return true;
  });

  const hasLiveData = isApiLive || isLiveDataConnected();

  return (
    <div className="home-root">

      <HeroBanner />

      <div className="container" style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>
        <div className="data-transparency-pill">
          <div className="data-source-status">
            <span className={isApiLive ? "pulse-green-dot" : "pulse-green-dot"} />
            <span className="status-label">
              {isApiLive ? `CineBook API Live (${liveMovies.length} movies connected)` : 'Verified Movie Data & Curated Trends'}
            </span>
          </div>
          <div className="data-source-note">
            <Info size={14} className="info-icon" />
            <span>{isApiLive ? 'Live MongoDB Backend connected' : 'Curated movie catalogue active'} • Real-time seat reservation engine</span>
          </div>
        </div>
      </div>

      <MovieCarousel
        title="Trending Now"
        tagline="WHAT'S BLOWING UP"
        icon={TrendingUp}
        movies={trendingNow}
        viewAllLink="/movies?filter=trending"
        bgType="white"
      />

      <MovieCarousel
        title="Popular This Week"
        tagline="TOP BOX OFFICE MOMENTUM"
        icon={Flame}
        movies={popularThisWeek}
        viewAllLink="/movies?filter=popular"
        bgType="light"
      />

      <MovieCarousel
        title="New Releases"
        tagline="JUST HIT THEATRES"
        icon={Clock}
        movies={newReleases}
        viewAllLink="/movies?filter=new"
        bgType="white"
      />

      <MovieCarousel
        title="Bollywood Movies"
        tagline="HINDI CINEMA & DESI BLOCKBUSTERS"
        icon={Film}
        movies={bollywoodMovies}
        viewAllLink="/movies?category=bollywood"
        bgType="light"
      />

      <MovieCarousel
        title="Hollywood Movies"
        tagline="GLOBAL BLOCKBUSTERS & SPECTACLES"
        icon={Globe}
        movies={hollywoodMovies}
        viewAllLink="/movies?category=hollywood"
        bgType="white"
      />

      <section id="events-section" className="section-wrapper events-showcase-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-tagline">
                <Music size={15} /> LIVE BEYOND THE SCREEN
              </span>
              <h2 className="section-title">Events & Entertainment</h2>
            </div>
            <div className="events-sub-hint">
              <span>Concerts • Navratri Dandiya • Comedy Shows</span>
            </div>
          </div>

          <div className="events-carousel-wrap">
            <div className="events-carousel-track">
              {ENTERTAINMENT_EVENTS.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container promo-banner-wrapper">
        <div className="promo-banner-card">
          <div className="promo-content">
            <div className="promo-badge">
              <Zap size={14} /> EXCLUSIVE CINEPASS BENEFIT
            </div>
            <h3 className="promo-title">Save 20% on all IMAX Laser & 4DX Screenings</h3>
            <p className="promo-desc">
              Experience movie magic with floor-shaking acoustics and crystal-clear laser projection. Apply coupon code <span className="promo-code-highlight">CINEPASS20</span> at checkout for instant savings.
            </p>
            <div className="promo-action-group">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => navigate('/movies')}
              >
                Explore IMAX Movies
              </button>
              <div className="promo-terms">Instant discount up to ₹150 • Valid on partner multiplexes</div>
            </div>
          </div>
          <div className="promo-artwork">
            <div className="promo-glow-ring" />
            <Armchair size={88} className="promo-artwork-icon" />
          </div>
        </div>
      </section>

      <MovieCarousel
        title="Coming Soon"
        tagline="HIGHLY ANTICIPATED PREMIERES"
        icon={Calendar}
        movies={comingSoon}
        viewAllLink="/movies?filter=upcoming"
        bgType="light"
      />

      <MovieCarousel
        title="Audience Favourites"
        tagline="CROWD PLEASERS & TOP RATED"
        icon={Heart}
        movies={audienceFavourites}
        viewAllLink="/movies?filter=top"
        bgType="white"
      />

      <MovieCarousel
        title="Hidden Gems"
        tagline="CRITICS' TREASURES & INDIE MASTERPIECES"
        icon={Gem}
        movies={hiddenGems}
        viewAllLink="/movies?filter=gems"
        bgType="light"
      />

      <section className="section-wrapper genre-browse-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-tagline">
                <Sparkles size={15} /> CURATED DISCOVERY
              </span>
              <h2 className="section-title">Explore by Category & Genre</h2>
            </div>
            <Link 
              to={activeCategory !== 'all' ? `/movies?category=${activeCategory}` : '/movies'} 
              className="section-link"
            >
              <span>View All Catalogue</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-category-filters-wrap">
            <div className="home-category-filters">
              <button
                type="button"
                className={`home-category-tab ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Movies ({baseMovies.length})
              </button>
              <button
                type="button"
                className={`home-category-tab ${activeCategory === 'bollywood' ? 'active' : ''}`}
                onClick={() => setActiveCategory('bollywood')}
              >
                <Film size={15} />
                <span>Bollywood ({bollywoodMovies.length})</span>
              </button>
              <button
                type="button"
                className={`home-category-tab ${activeCategory === 'hollywood' ? 'active' : ''}`}
                onClick={() => setActiveCategory('hollywood')}
              >
                <Globe size={15} />
                <span>Hollywood ({hollywoodMovies.length})</span>
              </button>
            </div>
          </div>

          <GenreFilter selectedGenre={activeGenre} onSelectGenre={setActiveGenre} />

          <div className="grid-movies">
            {filteredDiscovery.slice(0, 8).map(movie => (
              <div key={movie.slug || movie._id || movie.id}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-wrapper city-experience-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="section-tagline">
                <MapPin size={15} /> TOP THEATRES IN {cityName.toUpperCase()}
              </span>
              <h2 className="section-title">Popular Multiplexes</h2>
            </div>
            <div className="city-quick-selector">
              {CITIES.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  className={`city-pill ${c.id === selectedCity ? 'active' : ''}`}
                  onClick={() => setSelectedCity(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="theatres-showcase-grid">
            {THEATRES.map(th => {
              const defaultMovieTarget = baseMovies[0]?.slug || baseMovies[0]?._id || baseMovies[0]?.id || MOVIES[0].id;
              return (
                <div key={th.id} className="theatre-showcase-card">
                  <div className="theatre-card-top">
                    <div className="theatre-name-wrap">
                      <h3 className="theatre-name">{th.name}</h3>
                      <p className="theatre-location">{th.location}</p>
                    </div>
                    <span className="badge badge-dark theatre-dist">{th.distance}</span>
                  </div>

                  <div className="theatre-amenities">
                    {th.amenities.map((amenity, i) => (
                      <span key={i} className="badge badge-dark amenity-pill">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="theatre-screens-summary">
                    <div className="screen-tag-item">
                      <Layers size={14} color="#E63946" />
                      <span>{th.screens.length} Screens Active</span>
                    </div>
                    {th.cancellationAvailable && (
                      <div className="screen-tag-item">
                        <ShieldCheck size={14} color="#059669" />
                        <span>Free Cancellation</span>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm theatre-book-btn"
                    onClick={() => navigate(`/theatres/${defaultMovieTarget}`)}
                  >
                    <span>View Showtimes</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-wrapper features-strip-section">
        <div className="container">
          <div className="features-strip-grid">
            <div className="feature-card">
              <div className="feature-icon-box">
                <Award size={26} color="#E63946" />
              </div>
              <h4 className="feature-card-title">IMAX & 4DX Certified</h4>
              <p className="feature-card-desc">
                Crystal-clear 4K laser projection, overhead Dolby Atmos spatial audio, and motion seats for complete immersion.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Armchair size={26} color="#D97706" />
              </div>
              <h4 className="feature-card-title">Interactive Seat Map</h4>
              <p className="feature-card-desc">
                Real-time auditorium view with tier pricing (VIP Recliner, Premium, Classic). Reserve your exact seat in seconds.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <ShieldCheck size={26} color="#059669" />
              </div>
              <h4 className="feature-card-title">Direct Entry Passes</h4>
              <p className="feature-card-desc">
                Skip ticket counters with instant digital e-tickets and scannable QR passes sent to WhatsApp and email.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
