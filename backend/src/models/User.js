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
      select: false, 
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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plainPassword) {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
};

userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
};

const User = mongoose.model('User', userSchema);
export default User;
