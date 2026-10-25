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

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
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
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: [true, 'Screen reference is required'],
    },
    seats: {
      type: [String],
      required: [true, 'At least one seat identifier is required'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0 && v.length <= 10,
        message: 'A booking must contain between 1 and 10 seats',
      },
    },
    seatDetails: {
      type: [seatDetailSchema],
      default: [],
    },
    ticketCount: {
      type: Number,
      required: true,
      min: 1,
    },
    pricing: {
      baseAmount: { type: Number, required: true, min: 0 },
      convenienceFee: { type: Number, required: true, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    contactDetails: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    hold: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hold',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentOrderId: {
      type: String,
      default: null,
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    paymentDetails: {
      provider: { type: String, default: 'razorpay' },
      orderId: { type: String, default: '' },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date, default: null },
    },
    cancellationDetails: {
      cancelledAt: { type: Date, default: null },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reason: { type: String, default: '' },
      refundAmount: { type: Number, default: 0 },
      refundStatus: { type: String, enum: ['none', 'pending', 'processed'], default: 'none' },
    },
    qrCode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ showtime: 1, status: 1 });
bookingSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

bookingSchema.pre('validate', function () {
  if (!this.bookingReference) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    this.bookingReference = `CNB-${randomDigits}`;
  }
  if (!this.qrCode && this.bookingReference) {
    this.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${this.bookingReference}`;
  }
  if (this.seats && (!this.ticketCount || this.ticketCount !== this.seats.length)) {
    this.ticketCount = this.seats.length;
  }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
