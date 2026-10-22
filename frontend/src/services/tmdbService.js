import { MOVIES, BOLLYWOOD_MOVIES, HOLLYWOOD_MOVIES } from '../data/mockData';

const TMDB_API_KEY = import.meta.env?.VITE_TMDB_API_KEY || null;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

export const isLiveDataConnected = () => Boolean(TMDB_API_KEY);

/**
 * Fetch trending movies from TMDB or fallback to curated list
 */
export const getTrendingMovies = async () => {
  if (!TMDB_API_KEY) {
    return MOVIES.filter(m => m.tags?.includes('trending'));
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!res.ok) throw new Error('TMDB request failed');
    const data = await res.json();
    
    // Map TMDB items to CineBook format
    return data.results.slice(0, 10).map(item => ({
      id: `tmdb-${item.id}`,
      tmdbId: item.id,
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      certificate: item.adult ? 'A' : 'U/A 13+',
      duration: '2h 15m',
      rating: Number(item.vote_average.toFixed(1)),
      voteCount: `${(item.vote_count / 1000).toFixed(1)}K+`,
      releaseDate: item.release_date,
      languages: [item.original_language?.toUpperCase() || 'English'],
      formats: ['2D', 'IMAX Laser'],
      genres: ['Action', 'Thriller'],
      poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : MOVIES[0].poster,
      backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE}${item.backdrop_path}` : MOVIES[0].backdrop,
      synopsis: item.overview,
      isLiveTMDB: true,
      priceStartingAt: 280,
      tags: ['trending']
    }));
  } catch (error) {
    console.warn('Using curated trending dataset:', error.message);
    return MOVIES.filter(m => m.tags?.includes('trending'));
  }
};

/**
 * Fetch Bollywood movies — preserves the exact required Bollywood movie list
 */
export const getBollywoodMovies = async () => {
  return BOLLYWOOD_MOVIES;
};

/**
 * Fetch Hollywood movies — preserves the exact required Hollywood movie list
 */
export const getHollywoodMovies = async () => {
  return HOLLYWOOD_MOVIES;
};

