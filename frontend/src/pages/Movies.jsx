import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  X, 
  Film,
  Globe
} from 'lucide-react';
import MovieGrid from '../components/movies/MovieGrid';
import { MOVIES, BOLLYWOOD_MOVIES, HOLLYWOOD_MOVIES, GENRES, FORMATS, LANGUAGES } from '../data/mockData';
import { useBooking } from '../context/BookingContext';
import { moviesApi } from '../services/api';
import './Movies.css';

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchQuery } = useBooking();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'bollywood' | 'hollywood'
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [selectedFormat, setSelectedFormat] = useState('All Formats');
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity' | 'rating' | 'release'
  const [trendCategory, setTrendCategory] = useState('all'); // 'all' | 'trending' | 'popular' | 'new-releases' | 'coming-soon' | 'audience-favourite' | 'hidden-gems'

  const [liveMovies, setLiveMovies] = useState([]);
  const [isApiLive, setIsApiLive] = useState(false);

  // Sync with URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get('category') || searchParams.get('industry');
    const filterParam = searchParams.get('filter');

    if (categoryParam === 'bollywood' || filterParam === 'bollywood') {
      setSelectedCategory('bollywood');
    } else if (categoryParam === 'hollywood' || filterParam === 'hollywood') {
      setSelectedCategory('hollywood');
    } else if (categoryParam === 'all') {
      setSelectedCategory('all');
    }

    if (filterParam === 'upcoming') {
      setTrendCategory('coming-soon');
    } else if (filterParam === 'trending') {
      setTrendCategory('trending');
    } else if (filterParam === 'popular') {
      setTrendCategory('popular');
    } else if (filterParam === 'new') {
      setTrendCategory('new-releases');
    } else if (filterParam === 'top') {
      setTrendCategory('audience-favourite');
    } else if (filterParam === 'gems') {
      setTrendCategory('hidden-gems');
    }
  }, [searchParams]);

  // Load from real backend Movies API
  useEffect(() => {
    let isMounted = true;

    const params = { limit: 100 };
    if (selectedCategory !== 'all') params.industry = selectedCategory;
    if (selectedGenre !== 'all') params.genre = selectedGenre;
    if (selectedLanguage !== 'All Languages') params.language = selectedLanguage;
    if (selectedFormat !== 'All Formats') params.format = selectedFormat;
    if (trendCategory !== 'all') params.tag = trendCategory;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (sortBy === 'rating') params.sort = 'rating';
    else if (sortBy === 'release') params.sort = 'release';
    else params.sort = 'popularity';

    moviesApi.getMovies(params)
      .then((res) => {
        if (isMounted && res?.data) {
          setLiveMovies(res.data);
          setIsApiLive(true);
        }
      })
      .catch((err) => {
        console.warn('Backend Movies API error, switching to curated fallback:', err.message);
        if (isMounted) setIsApiLive(false);
      });

    return () => { isMounted = false; };
  }, [selectedCategory, selectedGenre, selectedLanguage, selectedFormat, trendCategory, searchQuery, sortBy]);

  // Base fallback source array determined strictly by category
  const sourceMovies = useMemo(() => {
    if (selectedCategory === 'bollywood') return BOLLYWOOD_MOVIES;
    if (selectedCategory === 'hollywood') return HOLLYWOOD_MOVIES;
    return MOVIES;
  }, [selectedCategory]);

  // Fallback filtering if offline
  const fallbackFiltered = useMemo(() => {
    return sourceMovies.filter((movie) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(query);
        const matchesGenre = movie.genres?.some(g => g.toLowerCase().includes(query));
        const matchesDirector = movie.director?.toLowerCase().includes(query);
        const matchesCast = movie.cast?.some(c => c.name.toLowerCase().includes(query));
        if (!matchesTitle && !matchesGenre && !matchesDirector && !matchesCast) return false;
      }
      if (trendCategory !== 'all' && !movie.tags?.includes(trendCategory)) return false;
      if (selectedGenre !== 'all' && !movie.genres?.some(g => g.toLowerCase() === selectedGenre.toLowerCase())) return false;
      if (selectedLanguage !== 'All Languages' && !movie.languages?.includes(selectedLanguage)) return false;
      if (selectedFormat !== 'All Formats' && !movie.formats?.includes(selectedFormat)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'release') return new Date(b.releaseDate || '2024-01-01') - new Date(a.releaseDate || '2024-01-01');
      return b.rating * (b.tags?.includes('trending') ? 1.4 : 1) - a.rating * (a.tags?.includes('trending') ? 1.4 : 1);
    });
  }, [sourceMovies, searchQuery, trendCategory, selectedGenre, selectedLanguage, selectedFormat, sortBy]);

  const filteredMovies = isApiLive ? liveMovies : fallbackFiltered;

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedGenre('all');
    setSelectedLanguage('All Languages');
    setSelectedFormat('All Formats');
    setTrendCategory('all');
    setSortBy('popularity');
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' ||
    selectedGenre !== 'all' || 
    selectedLanguage !== 'All Languages' || 
    selectedFormat !== 'All Formats' || 
    trendCategory !== 'all' || 
    searchQuery.trim() !== '';

  return (
    <div className="movies-page-root">
      {/* Header Banner */}
      <div className="movies-header-banner">
        <div className="container movies-header-content">
          <div>
            <span className="badge badge-primary header-tag">DISCOVER & BOOK</span>
            <h1 className="movies-page-title">Explore Entertainment</h1>
            <p className="movies-page-desc">
              Browse trending theatrical blockbusters, Bollywood hits, Hollywood spectacles, and upcoming premieres.
            </p>
          </div>

          {/* Quick Trend Category Tabs */}
          <div className="status-tabs-wrap">
            <button
              className={`status-tab-btn ${trendCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setTrendCategory('all'); setSearchParams(selectedCategory !== 'all' ? { category: selectedCategory } : {}); }}
            >
              All Films
            </button>
            <button
              className={`status-tab-btn ${trendCategory === 'trending' ? 'active' : ''}`}
              onClick={() => { 
                setTrendCategory('trending'); 
                const p = new URLSearchParams(searchParams);
                p.set('filter', 'trending');
                setSearchParams(p);
              }}
            >
              Trending
            </button>
            <button
              className={`status-tab-btn ${trendCategory === 'new-releases' ? 'active' : ''}`}
              onClick={() => { 
                setTrendCategory('new-releases'); 
                const p = new URLSearchParams(searchParams);
                p.set('filter', 'new');
                setSearchParams(p);
              }}
            >
              New Releases
            </button>
            <button
              className={`status-tab-btn ${trendCategory === 'coming-soon' ? 'active' : ''}`}
              onClick={() => { 
                setTrendCategory('coming-soon'); 
                const p = new URLSearchParams(searchParams);
                p.set('filter', 'upcoming');
                setSearchParams(p);
              }}
            >
              Coming Soon
            </button>
            <button
              className={`status-tab-btn ${trendCategory === 'hidden-gems' ? 'active' : ''}`}
              onClick={() => { 
                setTrendCategory('hidden-gems'); 
                const p = new URLSearchParams(searchParams);
                p.set('filter', 'gems');
                setSearchParams(p);
              }}
            >
              Hidden Gems
            </button>
          </div>
        </div>
      </div>

      <div className="container movies-main-content">
        {/* Category Switcher: All Movies, Bollywood, Hollywood */}
        <div className="movies-category-switch-wrap">
          <div className="movies-category-switch">
            <button
              type="button"
              className={`category-switch-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('all');
                const p = new URLSearchParams(searchParams);
                p.delete('category');
                p.delete('industry');
                setSearchParams(p);
              }}
            >
              All Movies
            </button>
            <button
              type="button"
              className={`category-switch-btn ${selectedCategory === 'bollywood' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('bollywood');
                const p = new URLSearchParams(searchParams);
                p.set('category', 'bollywood');
                setSearchParams(p);
              }}
            >
              <Film size={15} />
              <span>Bollywood</span>
            </button>
            <button
              type="button"
              className={`category-switch-btn ${selectedCategory === 'hollywood' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory('hollywood');
                const p = new URLSearchParams(searchParams);
                p.set('category', 'hollywood');
                setSearchParams(p);
              }}
            >
              <Globe size={15} />
              <span>Hollywood</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="filters-control-bar">
          <div className="filters-left">
            {/* Genre Select */}
            <div className="select-pill-wrap">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="custom-select"
                aria-label="Filter by Genre"
              >
                {GENRES.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Language Select */}
            <div className="select-pill-wrap">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="custom-select"
                aria-label="Filter by Language"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Format Select */}
            <div className="select-pill-wrap">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="custom-select"
                aria-label="Filter by Format"
              >
                {FORMATS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button 
                type="button" 
                className="btn btn-ghost btn-sm clear-filters-btn"
                onClick={handleResetFilters}
              >
                <X size={14} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="filters-right">
            <div className="sort-wrap">
              <ArrowUpDown size={15} color="#6B7280" />
              <span className="sort-label">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="custom-select sort-select"
                aria-label="Sort movies"
              >
                <option value="popularity">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="release">Release Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Summary */}
        <div className="results-meta-bar">
          <span className="results-count">
            Showing <strong style={{ color: '#171923' }}>{filteredMovies.length}</strong> movies
            {selectedCategory !== 'all' && (
              <span className="results-category-tag">
                {' '}in <strong style={{ textTransform: 'capitalize' }}>{selectedCategory}</strong>
              </span>
            )}
            {searchQuery && ` matching "${searchQuery}"`}
            {trendCategory !== 'all' && ` • ${trendCategory.replace('-', ' ')}`}
          </span>
        </div>

        {/* Movie Grid */}
        <MovieGrid
          movies={filteredMovies}
          emptyMessage={
            searchQuery 
              ? `No movies matched "${searchQuery}". Try searching for another movie or genre.` 
              : "No movies found with the selected filter criteria."
          }
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
};

export default Movies;
