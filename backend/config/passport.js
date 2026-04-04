const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

// Helper: generate a unique username from a display name
const generateUsername = async (baseName) => {
  // Strip non-alphanumeric characters, lowercase
  const slug = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
  let username = slug;
  let count = 0;

  while (await User.exists({ username })) {
    count += 1;
    username = `${slug}${count}`;
  }
  return username;
};

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email     = profile.emails?.[0]?.value?.toLowerCase();
        const googleId  = profile.id;
        const name      = profile.displayName || profile.name?.givenName || 'User';
        const avatarUrl = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // 1. Try to find user by googleId first (returning visitor)
        let user = await User.findOne({ googleId });

        if (!user) {
          // 2. Try to find by email (existing email/password account)
          user = await User.findOne({ email });

          if (user) {
            // Attach googleId to existing account and auto-verify since Google confirmed the email
            user.googleId  = googleId;
            user.provider  = user.provider || 'google';
            user.isVerified = true;
            user.verificationToken = null;
            user.verificationExpire = null;
            // Backfill avatar from Google if the user doesn't have one
            if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
            await user.save();
          } else {
            // 3. Brand new user — create from scratch
            const username = await generateUsername(name);
            user = await User.create({
              googleId,
              email,
              username,
              displayName: name,
              avatarUrl,
              provider: 'google',
              isVerified: true, // Auto-verified via Google
              // password field is optional (see updated schema)
            });
          }
        } else if (!user.isVerified) {
             // If they signed up through Google but somehow were unverified (edge case), verify them
             user.isVerified = true;
             await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error('Passport Google strategy error:', err);
        return done(err, null);
      }
    }
  )
);

// We use stateless JWT so we skip serializeUser/deserializeUser sessions.
// Passport still needs them defined to avoid runtime errors, even when sessions are not used.
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
