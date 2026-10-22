import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Payment provider order ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount in paise is required'],
      min: [100, 'Minimum amount is 100 paise (₹1)'],
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'attempted', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'razorpay',
    },
    paymentId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
      index: true,
    },
    signature: {
      type: String,
      trim: true,
      default: '',
    },
    receipt: {
      type: String,
      trim: true,
      default: '',
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    failureReason: {
      type: String,
      trim: true,
      default: '',
    },
    refundDetails: {
      refundId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed'],
        default: 'none',
      },
      refundedAt: { type: Date, default: null },
    },
    webhookEvents: {
      type: [webhookEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
