import mongoose from 'mongoose';

const seatDetailSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
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
    },
    tier: {
      type: String,
      required: true,
      enum: ['VIP Recliner', 'Premium', 'Classic'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const holdSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Showtime reference is required'],
      index: true,
    },
    seats: {
      type: [String],
      required: [true, 'At least one seat identifier is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.length <= 10,
        message: 'A hold must contain between 1 and 10 seats',
      },
    },
    seatDetails: {
      type: [seatDetailSchema],
      default: [],
    },
    pricing: {
      baseAmount: { type: Number, required: true, min: 0 },
      convenienceFee: { type: Number, required: true, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    expiresAt: {
      type: Date,
      required: [true, 'Hold expiration date is required'],
    },
    status: {
      type: String,
      enum: ['held', 'released', 'expired', 'converted'],
      default: 'held',
      index: true,
    },
    convertedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

holdSchema.index({ showtime: 1, status: 1 });
holdSchema.index({ user: 1, status: 1 });
holdSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 }); 

const Hold = mongoose.model('Hold', holdSchema);
export default Hold;
