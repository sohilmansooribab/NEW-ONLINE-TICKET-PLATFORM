import mongoose from 'mongoose';

const bookedSeatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const heldSeatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    holdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hold',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen reference is required'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Showtime start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'Showtime end time is required'],
      index: true,
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX 3D', 'IMAX Laser', '4DX', 'ScreenX', 'Macro XE'],
      default: '2D',
      index: true,
    },
    language: {
      type: String,
      required: [true, 'Show language is required'],
      trim: true,
      default: 'Hindi',
    },
    tierPricing: {
      'VIP Recliner': {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        default: 520,
      },
      'Premium': {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        default: 380,
      },
      'Classic': {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        default: 280,
      },
    },
    bookedSeats: {
      type: [bookedSeatSchema],
      default: [],
    },
    heldSeats: {
      type: [heldSeatSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['scheduled', 'available', 'fast-filling', 'almost-full', 'sold-out', 'cancelled', 'completed'],
      default: 'available',
      index: true,
    },
    cancellationAvailable: {
      type: Boolean,
      default: true,
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

showtimeSchema.index({ screen: 1, startTime: 1, endTime: 1 });
showtimeSchema.index({ theatre: 1, startTime: 1 });
showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ movie: 1, theatre: 1, startTime: 1 });
showtimeSchema.index({ 'heldSeats.expiresAt': 1 });

showtimeSchema.statics.findConflict = async function (screenId, startTime, endTime, excludeShowtimeId = null) {
  const query = {
    screen: screenId,
    status: { $ne: 'cancelled' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeShowtimeId) {
    query._id = { $ne: excludeShowtimeId };
  }

  return await this.findOne(query);
};

const Showtime = mongoose.model('Showtime', showtimeSchema);
export default Showtime;
