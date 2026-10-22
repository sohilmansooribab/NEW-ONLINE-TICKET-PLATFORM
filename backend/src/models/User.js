import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Prevents passwordHash from being returned by default
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'ORGANIZER', 'ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'USER',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to securely compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords with bcrypt
userSchema.statics.hashPassword = async function (plainPassword) {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
};

// Override toJSON to ensure passwordHash and __v are never serialized in API responses
userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
};

const User = mongoose.model('User', userSchema);
export default User;
