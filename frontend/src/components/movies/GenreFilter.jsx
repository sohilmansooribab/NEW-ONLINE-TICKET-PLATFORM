import React from 'react';
import { 
  Film, 
  Flame, 
  Rocket, 
  Heart, 
  Eye, 
  Sparkles, 
  Smile, 
  Ghost, 
  Compass 
} from 'lucide-react';
import { GENRES } from '../../data/mockData';
import './GenreFilter.css';

const iconMap = {
  Film: Film,
  Flame: Flame,
  Rocket: Rocket,
  Heart: Heart,
  Eye: Eye,
  Sparkles: Sparkles,
  Smile: Smile,
  Ghost: Ghost,
  Compass: Compass,
};

const GenreFilter = ({ selectedGenre, onSelectGenre }) => {
  return (
    <div className="genre-filter-wrapper">
      <div className="genre-filter-scroll">
        {GENRES.map((genre) => {
          const IconComponent = iconMap[genre.icon] || Film;
          const isSelected = selectedGenre.toLowerCase() === genre.id.toLowerCase() || 
            (genre.id === 'all' && (!selectedGenre || selectedGenre === 'all'));

          return (
            <button
              key={genre.id}
              className={`genre-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectGenre(genre.id)}
            >
              <IconComponent size={16} className="genre-icon" />
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenreFilter;
