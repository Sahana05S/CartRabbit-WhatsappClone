const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { register, login, getMe, forgotPassword, resetPassword, verifyEmail } = require('../controllers/authController');
const { setupMfa, verifyEnableMfa, completeLoginMfa, recoveryLoginMfa, regenerateRecoveryCodes, disableMfa } = require('../controllers/mfaController');
const { protect } = require('../middleware/authMiddleware');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Existing email/password routes (untouched) ────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);

// ── MFA routes ────────────────────────────────────────────────────────────────
router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/verify-enable', protect, verifyEnableMfa);
router.post('/mfa/complete-login', completeLoginMfa); // No protect mid: relies on challengeToken
router.post('/mfa/recovery-login', recoveryLoginMfa); // No protect mid: relies on challengeToken
router.post('/mfa/regenerate-recovery-codes', protect, regenerateRecoveryCodes);
router.post('/mfa/disable', protect, disableMfa);

// ── Google OAuth routes ───────────────────────────────────────────────────────

// Step 1: Redirect user to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Step 2: Google redirects back here after user consents
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      // req.user is the Mongoose document set by passport strategy
      if (req.user.mfaEnabled) {
        const mfaToken = jwt.sign(
          { id: req.user._id, mfaChallenge: true },
          process.env.JWT_SECRET,
          { expiresIn: '5m' }
        );
        // Direct pass to the frontend URL to avoid cookie Domain/Port restrictions
        return res.redirect(`${CLIENT_URL}/login?mfa_token=${mfaToken}`);
      }

      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Direct pass to the frontend URL to avoid cookie Domain/Port restrictions
      res.redirect(`${CLIENT_URL}/auth/google/success?oauth_token=${token}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;
