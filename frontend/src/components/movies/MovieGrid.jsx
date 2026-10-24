import React from 'react';
import MovieCard from './MovieCard';
import { Film, RefreshCw } from 'lucide-react';
import './MovieGrid.css';

const MovieGrid = ({ movies = [], emptyMessage = "No movies match your criteria.", onResetFilters }) => {
  if (movies.length === 0) {
    return (
      <div className="movie-grid-empty">
        <div className="empty-icon-wrap">
          <Film size={44} color="#646777" />
        </div>
        <h3 className="empty-title">No Movies Found</h3>
        <p className="empty-desc">{emptyMessage}</p>
        {onResetFilters && (
          <button 
            type="button" 
            className="btn btn-secondary empty-reset-btn"
            onClick={onResetFilters}
          >
            <RefreshCw size={16} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="movie-grid-container">
      {movies.map((movie) => (
        <MovieCard key={movie.slug || movie._id || movie.id} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
