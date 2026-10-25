import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRightIcon } from 'lucide-react';
import MovieCard from '../movies/MovieCard';
import './MovieCarousel.css';

const MovieCarousel = ({ 
  title, 
  tagline, 
  icon: IconComponent, 
  movies = [], 
  viewAllLink = '/movies',
  bgType = 'white' 
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollBounds = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollBounds();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollBounds);
      window.addEventListener('resize', checkScrollBounds);
      return () => {
        el.removeEventListener('scroll', checkScrollBounds);
        window.removeEventListener('resize', checkScrollBounds);
      };
    }
  }, [movies]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 520;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className={`carousel-section-root ${bgType === 'light' ? 'bg-light-surface' : 'bg-white-surface'}`}>
      <div className="container">

        <div className="carousel-section-header">
          <div className="carousel-title-group">
            {tagline && (
              <span className="carousel-tagline">
                {IconComponent && <IconComponent size={14} className="carousel-tag-icon" />}
                <span>{tagline}</span>
              </span>
            )}
            <h2 className="carousel-title">{title}</h2>
          </div>

          <div className="carousel-controls-group">

            <Link to={viewAllLink} className="carousel-view-all-link">
              <span>View All</span>
              <ArrowRightIcon size={16} />
            </Link>

            <div className="carousel-nav-arrows">
              <button
                type="button"
                className={`carousel-nav-arrow prev ${!canScrollLeft ? 'disabled' : ''}`}
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label={`Scroll ${title} left`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={`carousel-nav-arrow next ${!canScrollRight ? 'disabled' : ''}`}
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label={`Scroll ${title} right`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="carousel-track-wrapper">
          <div className="carousel-scroll-track" ref={scrollRef}>
            {movies.map((movie) => (
              <div key={movie.slug || movie._id || movie.id} className="carousel-card-wrapper">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MovieCarousel;
