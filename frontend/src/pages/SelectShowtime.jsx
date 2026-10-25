import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Film, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MOVIES, THEATRES } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { showtimesApi, moviesApi } from '../services/api';
import './SelectShowtime.css';

const generateDates = () => {
  const dates = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const fullDateStr = `${dayName}, ${dateNum} ${monthName} 2026`;
    dates.push({
      id: i,
      day: dayName,
      dateNum,
      month: monthName,
      fullDateStr
    });
  }
  return dates;
};

const SelectShowtime = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { selectedCity, activeBooking, updateBookingState } = useBooking();

  const datesList = generateDates();
  const [selectedDateObj, setSelectedDateObj] = useState(datesList[0]);
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('ALL');

  const [movie, setMovie] = useState(() => 
    MOVIES.find(m => m.id === movieId || m.slug === movieId || m._id === movieId) || activeBooking?.movie || MOVIES[0]
  );
  const [apiShowtimes, setApiShowtimes] = useState([]);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    moviesApi.getMovie(movieId)
      .then((res) => {
        if (isMounted && res?.data) {
          setMovie(res.data);
        }
      })
      .catch((err) => {
        console.warn('Movie details fetch fallback:', err.message);
      });

    return () => { isMounted = false; };
  }, [movieId]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    showtimesApi.getShowtimes({ movie: movieId, city: selectedCity })
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setApiShowtimes(res.data);
          setIsLiveApi(true);
        } else if (isMounted && res?.count > 0 && res.showtimes) {
          setApiShowtimes(res.showtimes);
          setIsLiveApi(true);
        } else {

          showtimesApi.getShowtimes({ limit: 50 })
            .then(allRes => {
              const shows = allRes?.showtimes || allRes?.data || [];
              const currentId = movie?._id;
              const currentSlug = movie?.slug;
              const matched = shows.filter(st => 
                (currentId && st.movie?._id === currentId) || 
                (movieId && st.movie?.slug === movieId) || 
                (currentSlug && st.movie?.slug === currentSlug)
              );
              if (isMounted && matched.length > 0) {
                setApiShowtimes(matched);
                setIsLiveApi(true);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Backend showtimes fetch fallback to local mock:', err.message);
        if (isMounted) setIsLiveApi(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [movieId, selectedCity, movie?._id, movie?.slug]);

  const displayedTheatres = useMemo(() => {
    if (!isLiveApi || apiShowtimes.length === 0) {
      return THEATRES;
    }

    const map = new Map();
    for (const st of apiShowtimes) {
      const th = st.theatre;
      if (!th) continue;
      const thId = th._id || th.id || th.slug;

      if (!map.has(thId)) {
        map.set(thId, {
          id: thId,
          _id: th._id,
          name: th.name,
          location: th.location || `${th.city || 'Delhi'} Central`,
          distance: th.distance || '3.5 km away',
          amenities: th.amenities || ['Dolby Atmos', '4K Laser', 'Recliners'],
          cancellationAvailable: th.cancellationAvailable !== false,
          screensMap: new Map(),
        });
      }

      const theatreObj = map.get(thId);
      const scr = st.screen || { name: 'Screen 1', format: st.format || 'IMAX Laser' };
      const scrId = scr._id || scr.id || scr.name;

      if (!theatreObj.screensMap.has(scrId)) {
        theatreObj.screensMap.set(scrId, {
          id: scrId,
          name: scr.name,
          format: st.format || scr.format || 'IMAX 3D',
          showtimes: [],
        });
      }

      const screenObj = theatreObj.screensMap.get(scrId);
      const startTime = new Date(st.startTime);
      const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      screenObj.showtimes.push({
        id: st._id,
        _id: st._id,
        time: timeStr,
        price: st.tierPricing?.['Classic'] || st.tierPricing?.['Premium'] || 280,
        status: st.computedStatus || (st.status === 'fast-filling' ? 'fast-filling' : st.status === 'sold-out' ? 'sold-out' : 'available'),
        rawShowtime: st,
      });
    }

    const result = [];
    for (const th of map.values()) {
      result.push({
        ...th,
        screens: Array.from(th.screensMap.values()),
      });
    }

    return result.length > 0 ? result : THEATRES;
  }, [isLiveApi, apiShowtimes]);

  const handleShowtimeClick = (theatre, screen, showtime) => {
    updateBookingState({
      movie,
      theatre,
      screen,
      showtime: showtime.rawShowtime || showtime,
      showtimeId: showtime._id || showtime.id,
      date: selectedDateObj.fullDateStr,
      time: showtime.time,
      format: screen.format,
      selectedSeats: [], 
      hold: null,
      authoritativePricing: null,
    });

    const targetParam = showtime._id || showtime.id || theatre.id;
    navigate(`/select-seats/${targetParam}`);
  };

  const safeMovie = movie || MOVIES[0];

  return (
    <div className="select-showtime-root">

      <div className="showtime-movie-bar">
        <div className="container movie-bar-content">
          <div className="movie-bar-left">
            <img 
              src={safeMovie.poster} 
              alt={safeMovie.title} 
              className="movie-bar-thumb" 
            />
            <div>
              <div className="movie-bar-badges">
                <span className="badge badge-primary">{safeMovie.certificate || safeMovie.certification || 'U/A'}</span>
                <span className="badge badge-dark">{(safeMovie.languages || ['Hindi']).join(', ')}</span>
                {isLiveApi && (
                  <span className="badge badge-gold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Live Schedule Active
                  </span>
                )}
              </div>
              <h2 className="movie-bar-title">{safeMovie.title}</h2>
              <p className="movie-bar-meta">
                {safeMovie.duration} • {(safeMovie.genres || []).join(', ')}
              </p>
            </div>
          </div>

          <div className="movie-bar-right">
            <Link to={`/movie/${safeMovie.slug || safeMovie.id || safeMovie._id}`} className="btn btn-outline btn-sm">
              Movie Details
            </Link>
          </div>
        </div>
      </div>

      <div className="container showtime-main">

        <div className="date-selector-wrapper">
          <div className="date-selector-scroll">
            {datesList.map((d) => (
              <button
                key={d.id}
                className={`date-card-btn ${selectedDateObj.id === d.id ? 'active' : ''}`}
                onClick={() => setSelectedDateObj(d)}
              >
                <span className="date-day">{d.day}</span>
                <span className="date-num">{d.dateNum}</span>
                <span className="date-month">{d.month}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="showtime-filters-bar">
          <div className="filter-group">
            <span className="filter-label">Experience:</span>
            <div className="filter-pills">
              {['ALL', 'IMAX 3D', 'IMAX Laser', '4DX', '2D'].map(fmt => (
                <button
                  key={fmt}
                  className={`sub-filter-pill ${formatFilter === fmt ? 'active' : ''}`}

                  onClick={() => setFormatFilter(fmt === 'ALL' ? 'all' : fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="showtime-legend">
            <span className="legend-item"><span className="dot dot-avail" /> Available</span>
            <span className="legend-item"><span className="dot dot-fast" /> Fast Filling</span>
            <span className="legend-item"><span className="dot dot-full" /> Almost Full</span>
          </div>
        </div>

        <div className="theatres-list-container">
          {displayedTheatres.map((theatre) => {

            const matchingScreens = (theatre.screens || []).filter(screen => {
              if (formatFilter === 'ALL') return true;
              return screen.format?.toLowerCase().includes(formatFilter.toLowerCase());
            });

            if (matchingScreens.length === 0) return null;

            return (
              <div key={theatre.id || theatre._id} className="theatre-booking-card">
                <div className="theatre-card-header">
                  <div className="theatre-info-title-wrap">
                    <h3 className="theatre-card-name">{theatre.name}</h3>
                    <p className="theatre-card-address">
                      <MapPin size={14} className="map-icon" />
                      <span>{theatre.location}</span>
                      <span className="dist-sep">•</span>
                      <span className="dist-text">{theatre.distance || 'Central'}</span>
                    </p>
                  </div>

                  {theatre.cancellationAvailable && (
                    <div className="theatre-cancellation-badge">
                      <ShieldCheck size={14} color="#10B981" />
                      <span>Cancellation Available</span>
                    </div>
                  )}
                </div>

                <div className="theatre-amenities-row">
                  {(theatre.amenities || []).map((a, i) => (
                    <span key={i} className="badge badge-dark amenity-tag">{a}</span>
                  ))}
                </div>

                <div className="theatre-screens-wrap">
                  {matchingScreens.map((screen) => (
                    <div key={screen.id || screen._id} className="screen-row">
                      <div className="screen-meta">
                        <span className="screen-name-label">{screen.name}</span>
                        <span className="badge badge-primary screen-format-tag">{screen.format}</span>
                      </div>

                      <div className="showtimes-chips-grid">
                        {(screen.showtimes || []).map((st, idx) => (
                          <button
                            key={st.id || st._id || idx}
                            type="button"
                            className={`showtime-chip status-${st.status || 'available'}`}
                            onClick={() => handleShowtimeClick(theatre, screen, st)}
                          >
                            <span className="st-time">{st.time}</span>
                            <span className="st-price">₹{st.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelectShowtime;
