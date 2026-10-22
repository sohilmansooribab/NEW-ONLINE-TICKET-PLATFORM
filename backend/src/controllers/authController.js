import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Helper function to generate signed JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'cinebook_default_secret_key_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
};

/**
 * @route   POST /api/auth/signup
 * @desc    Public customer registration (Strictly limited to USER role)
 * @access  Public
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name',
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    // 2. Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format',
      });
    }

    // 3. Validate password length
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // 4. Role restriction: public signup cannot register as ADMIN or ORGANIZER
    if (role && role.toString().trim().toUpperCase() !== 'USER') {
      return res.status(400).json({
        success: false,
        message: 'Public registration is only permitted for the USER role. ADMIN and ORGANIZER accounts cannot be self-registered.',
      });
    }

    // 5. Check if email is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // 6. Hash password with bcrypt
    const passwordHash = await User.hashPassword(password);

    // 7. Persist user with USER role
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'USER',
    });

    // 8. Generate JWT token
    const token = generateToken(newUser);

    // 9. Respond with user object and token (passwordHash is omitted by User.toJSON)
    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: newUser.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, verify password hash, and return JWT
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.toString().trim().toLowerCase();

    // 3. Find user and explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Verify password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 5. Generate JWT token
    const token = generateToken(user);

    // 6. Respond with user object and token
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Requires Bearer JWT)
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
};
