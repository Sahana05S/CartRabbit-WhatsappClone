const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const formatUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  avatarColor: user.avatarColor,
  createdAt: user.createdAt,
});

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} is already in use.` });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a verification token (24h expiry)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken: hashedToken,
      verificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Simulate sending email — print to console
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyUrl = `${CLIENT_URL}/verify-email/${rawToken}`;
    console.log(`\n\n--- EMAIL VERIFICATION SIMULATION ---`);
    console.log(`To verify the account for ${user.email}, open this link:\n`);
    console.log(`${verifyUrl}\n`);
    console.log(`--------------------------------------\n\n`);

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email (or server console) for a verification link before logging in.',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)[0].message;
      return res.status(400).json({ success: false, message });
    }
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +mfaEnabled');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Block unverified accounts
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox (or server console) for the verification link.',
        unverified: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.mfaEnabled) {
      const mfaToken = jwt.sign(
        { id: user._id, mfaChallenge: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ success: true, mfaRequired: true, mfaToken });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: formatUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};

// GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or has expired. Please register again.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpire = null;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Email verified! Welcome to NexTalk.', token, user: formatUser(user) });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email.' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    if (!user) {
      // Return 200 anyway to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

    // Simulate sending email by logging to the console
    console.log(`\n\n--- PASSWORD RESET SIMULATION ---`);
    console.log(`To reset password for ${user.email}, go to the following link:\n`);
    console.log(`${resetUrl}\n`);
    console.log(`----------------------------------\n\n`);

    res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (!req.body.password) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful! Please log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

module.exports = { register, login, getMe, generateToken, formatUser, forgotPassword, resetPassword, verifyEmail };
