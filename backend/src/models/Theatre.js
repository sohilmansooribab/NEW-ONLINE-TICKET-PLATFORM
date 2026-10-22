import mongoose from 'mongoose';

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre venue name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Theatre slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Theatre location / landmark is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City identifier is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    distance: {
      type: String,
      trim: true,
      default: '',
    },
    amenities: {
      type: [String],
      default: ['Dolby Atmos', '4K Laser Projection', 'Gourmet In-Seat Dining'],
    },
    cancellationAvailable: {
      type: Boolean,
      default: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    partnerTier: {
      type: String,
      enum: ['Diamond', 'Platinum', 'Gold', 'Silver'],
      default: 'Platinum',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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

// Virtual for populated screens
theatreSchema.virtual('screens', {
  ref: 'Screen',
  localField: '_id',
  foreignField: 'theatre',
});

// Auto-generate slug if not provided
theatreSchema.pre('validate', function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
});

const Theatre = mongoose.model('Theatre', theatreSchema);
export default Theatre;
