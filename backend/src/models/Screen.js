import mongoose from 'mongoose';

/**
 * Standard CineBook seat layout configuration:
 * Rows A & B: VIP Recliner (12 seats each)
 * Rows C, D, E, F: Premium (16 seats each)
 * Rows G, H, J: Classic (18 seats each)
 */
export const DEFAULT_TIER_CONFIG = [
  { name: 'VIP Recliner', defaultPrice: 520, rows: ['A', 'B'], seatsPerRow: 12 },
  { name: 'Premium', defaultPrice: 380, rows: ['C', 'D', 'E', 'F'], seatsPerRow: 16 },
  { name: 'Classic', defaultPrice: 280, rows: ['G', 'H', 'J'], seatsPerRow: 18 },
];

export const generateDefaultSeats = () => {
  const seats = [];
  for (const tier of DEFAULT_TIER_CONFIG) {
    for (const row of tier.rows) {
      for (let num = 1; num <= tier.seatsPerRow; num++) {
        seats.push({
          seatId: `${row}${num}`,
          row,
          number: num,
          tier: tier.name,
          isActive: true,
        });
      }
    }
  }
  return seats;
};

const seatItemSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: [true, 'Seat ID is required (e.g., A1, D8)'],
      trim: true,
      uppercase: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    number: {
      type: Number,
      required: true,
      min: [1, 'Seat number must be >= 1'],
    },
    tier: {
      type: String,
      required: true,
      enum: ['VIP Recliner', 'Premium', 'Classic'],
      default: 'Classic',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screenNumber: {
      type: Number,
      required: [true, 'Screen number is required'],
      min: [1, 'Screen number must be at least 1'],
    },
    name: {
      type: String,
      required: [true, 'Screen name is required (e.g. Audi 1 — IMAX Laser)'],
      trim: true,
      maxlength: [100, 'Screen name cannot exceed 100 characters'],
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX 3D', 'IMAX Laser', '4DX', 'ScreenX', 'Macro XE'],
      default: '2D',
      index: true,
    },
    soundSystem: {
      type: String,
      trim: true,
      default: 'Dolby Atmos',
    },
    seats: {
      type: [seatItemSchema],
      default: [],
    },
    totalSeats: {
      type: Number,
      min: [1, 'Screen must have at least 1 seat'],
      default: 142,
    },
    isActive: {
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

// Compound index to ensure uniqueness of screen number within a single theatre
screenSchema.index({ theatre: 1, screenNumber: 1 }, { unique: true });

// Auto-populate seats if not explicitly provided
screenSchema.pre('validate', function () {
  if (!this.seats || this.seats.length === 0) {
    this.seats = generateDefaultSeats();
  }
  this.totalSeats = this.seats.length;
});

const Screen = mongoose.model('Screen', screenSchema);
export default Screen;
