import mongoose from 'mongoose';

const castMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cast member name is required'],
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Movie slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description / synopsis is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    poster: {
      type: String,
      required: [true, 'Movie poster URL is required'],
      trim: true,
    },
    backdrop: {
      type: String,
      trim: true,
      default: '',
    },
    genres: {
      type: [String],
      required: [true, 'At least one genre is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A movie must have at least one genre',
      },
      index: true,
    },
    languages: {
      type: [String],
      required: [true, 'At least one language is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A movie must have at least one language',
      },
      index: true,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
      index: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration string (e.g. 2h 30m) is required'],
      trim: true,
    },
    durationMinutes: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
      default: 120,
    },
    cast: {
      type: [castMemberSchema],
      default: [],
    },
    director: {
      type: String,
      required: [true, 'Director name is required'],
      trim: true,
      index: true,
    },
    certification: {
      type: String,
      required: [true, 'Certification (e.g. U, U/A 13+, U/A 16+, A) is required'],
      trim: true,
      default: 'U/A 13+',
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [10, 'Rating cannot exceed 10'],
      default: 8.0,
      index: true,
    },
    voteCount: {
      type: String,
      default: '10K+',
    },
    formats: {
      type: [String],
      default: ['2D'],
    },
    industry: {
      type: String,
      enum: {
        values: ['bollywood', 'hollywood', 'regional', 'international'],
        message: '{VALUE} is not a valid industry type',
      },
      default: 'bollywood',
      lowercase: true,
      index: true,
    },
    isHeroFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    heroTag: {
      type: String,
      trim: true,
      default: '',
    },
    priceStartingAt: {
      type: Number,
      min: [0, 'Starting price cannot be negative'],
      default: 250,
    },
    tags: {
      type: [String],
      default: ['trending'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['published', 'draft', 'archived'],
        message: '{VALUE} is not a valid publication status',
      },
      default: 'published',
      lowercase: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

movieSchema.virtual('synopsis').get(function () {
  return this.description;
});

movieSchema.index({
  title: 'text',
  description: 'text',
  director: 'text',
  'cast.name': 'text',
});

movieSchema.index({ industry: 1, isPublished: 1, rating: -1 });

movieSchema.pre('validate', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  if (this.status) {
    this.isPublished = this.status === 'published';
  }
});

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
