const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');
const { generateToken, formatUser } = require('./authController');

// Basic in-memory rate limiting for MFA attempts
const mfaAttempts = new Map(); // key: userId, value: { count, lockUntil }

// POST /api/auth/mfa/setup
const setupMfa = async (req, res) => {
  try {
    const user = req.user; // assuming route is protected

    // Generate a new TOTP secret for the user
    const secret = speakeasy.generateSecret({
      name: `NexTalk (${user.email})`,
      issuer: 'NexTalk',
    });

    // We store the encrypted secret but DO NOT enable MFA yet
    user.mfaSecret = encrypt(secret.base32);
    // Explicitly keep it disabled until they verify a code later
    user.mfaEnabled = false; 
    
    await user.save();

    // Generate QR code data URL
    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) {
        console.error('Error generating QR code:', err);
        return res.status(500).json({ success: false, message: 'Could not generate QR code.' });
      }

      res.status(200).json({
        success: true,
        data: {
          qrCodeDataUrl: dataUrl,
          manualEntryKey: secret.base32,
        },
      });
    });

  } catch (error) {
    console.error('MFA Setup error:', error);
    res.status(500).json({ success: false, message: 'Server error during MFA setup.' });
  }
};

// POST /api/auth/mfa/verify-enable
const verifyEnableMfa = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'TOTP token is required.' });
    }

    // Because mfaSecret is select: false, we must re-fetch the user to get the secret
    const user = await User.findById(req.user._id).select('+mfaSecret');
    
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'MFA setup not initiated.' });
    }

    const unencryptedSecret = decrypt(user.mfaSecret);

    // Verify the TOTP token
    const isVerified = speakeasy.totp.verify({
      secret: unencryptedSecret,
      encoding: 'base32',
      token,
      window: 1 // allows 30 seconds before and after window
    });

    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid or expired TOTP code.' });
    }

    // If verified, generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }).map(() =>
      crypto.randomBytes(4).toString('hex') // e.g. 5d8a9f3c
    );

    // Hash the recovery codes securely (we can use Promise.all or simple loop)
    const salt = await bcrypt.genSalt(10);
    const hashedCodes = await Promise.all(
      recoveryCodes.map(code => bcrypt.hash(code, salt))
    );

    user.mfaEnabled = true;
    user.mfaEnabledAt = new Date();
    user.mfaRecoveryCodes = hashedCodes;

    await user.save();

    console.log(`[SECURITY AUDIT] User ${user._id} (${user.email}) successfully ENABLED MFA via TOTP.`);

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully.',
      data: {
        recoveryCodes // return plain-text ONCE
      }
    });

  } catch (error) {
    console.error('MFA Verify error:', error);
    res.status(500).json({ success: false, message: 'Server error during MFA verification.' });
  }
};

// POST /api/auth/mfa/complete-login
const completeLoginMfa = async (req, res) => {
  try {
    const { challengeToken, totpCode } = req.body;
    if (!challengeToken || !totpCode) {
      return res.status(400).json({ success: false, message: 'Token and TOTP code required.' });
    }

    // Verify short-lived challenge token
    let decoded;
    try {
      decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Challenge token invalid or expired.' });
    }

    // Ensure it's explicitly a challenge token
    if (!decoded.mfaChallenge) {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }

    const userId = decoded.id;

    // Check basic rate limits
    const limit = mfaAttempts.get(userId) || { count: 0, lockUntil: 0 };
    if (limit.lockUntil > Date.now()) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    }

    const user = await User.findById(userId).select('+mfaSecret');
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ success: false, message: 'Invalid user or MFA not configured.' });
    }

    const unencryptedSecret = decrypt(user.mfaSecret);
    const isVerified = speakeasy.totp.verify({
      secret: unencryptedSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1
    });

    if (!isVerified) {
      limit.count += 1;
      if (limit.count >= 5) {
        limit.lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 mins
      }
      mfaAttempts.set(userId, limit);
      return res.status(401).json({ success: false, message: 'Invalid TOTP code.' });
    }

    // Success - clean rate limit
    mfaAttempts.delete(userId);
    
    console.log(`[SECURITY AUDIT] User ${userId} successfully completed MFA login (TOTP).`);

    // Issue final auth JWT
    const finalToken = generateToken(user._id);
    res.json({ success: true, token: finalToken, user: formatUser(user) });

  } catch (err) {
    console.error('MFA Complete Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during MFA login.' });
  }
};

// POST /api/auth/mfa/recovery-login
const recoveryLoginMfa = async (req, res) => {
  try {
    const { challengeToken, recoveryCode } = req.body;
    if (!challengeToken || !recoveryCode) {
      return res.status(400).json({ success: false, message: 'Token and recovery code required.' });
    }

    // Verify short-lived challenge token
    let decoded;
    try {
      decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Challenge token invalid or expired. Please sign in again.' });
    }

    if (!decoded.mfaChallenge) {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }

    const userId = decoded.id;

    // Check limits
    const limit = mfaAttempts.get(userId) || { count: 0, lockUntil: 0 };
    if (limit.lockUntil > Date.now()) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    }

    const user = await User.findById(userId).select('+mfaRecoveryCodes');
    if (!user || !user.mfaRecoveryCodes || user.mfaRecoveryCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'No recovery codes found.' });
    }

    let matchedCodeIndex = -1;
    // Bcrypt compare array of hashed codes against submitted code
    for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
        const isMatch = await bcrypt.compare(recoveryCode, user.mfaRecoveryCodes[i]);
        if (isMatch) {
            matchedCodeIndex = i;
            break;
        }
    }

    if (matchedCodeIndex === -1) {
      limit.count += 1;
      if (limit.count >= 5) {
        limit.lockUntil = Date.now() + 5 * 60 * 1000;
      }
      mfaAttempts.set(userId, limit);
      return res.status(401).json({ success: false, message: 'Invalid recovery code.' });
    }

    // Success - Consume the recovery code (remove from array) so it can't be reused
    user.mfaRecoveryCodes.splice(matchedCodeIndex, 1);
    await user.save();
    
    // Clean rate limits
    mfaAttempts.delete(userId);
    
    console.log(`[SECURITY AUDIT] User ${userId} used a Recovery Code to login. Remaining codes: ${user.mfaRecoveryCodes.length}`);

    // Issue final auth JWT
    const finalToken = generateToken(user._id);
    res.json({ success: true, token: finalToken, user: formatUser(user) });

  } catch (err) {
    console.error('MFA Recovery error:', err);
    res.status(500).json({ success: false, message: 'Server error during recovery login.' });
  }
};

// POST /api/auth/mfa/regenerate-recovery-codes
const regenerateRecoveryCodes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ success: false, message: 'MFA is not enabled for this user.' });
    }

    // Generate new recovery codes
    const newRecoveryCodes = Array.from({ length: 8 }).map(() =>
      crypto.randomBytes(4).toString('hex')
    );

    // Hash the new codes
    const salt = await bcrypt.genSalt(10);
    const hashedCodes = await Promise.all(
      newRecoveryCodes.map(code => bcrypt.hash(code, salt))
    );

    // Overwrite the existing array, thereby immediately invalidating old codes
    user.mfaRecoveryCodes = hashedCodes;
    await user.save();
    
    console.log(`[SECURITY AUDIT] User ${user._id} regenerated recovery codes. All previous codes invalidated.`);

    res.status(200).json({
      success: true,
      message: 'Recovery codes regenerated successfully.',
      data: {
        recoveryCodes: newRecoveryCodes // Return plain text ONCE
      }
    });
  } catch (error) {
    console.error('Regenerate Recovery Codes error:', error);
    res.status(500).json({ success: false, message: 'Server error regenerating codes.' });
  }
};

// POST /api/auth/mfa/disable
const disableMfa = async (req, res) => {
  try {
    const { password, code } = req.body;
    
    // Select password, mfaSecret, and mfaRecoveryCodes just in case we need them to verify the user
    const user = await User.findById(req.user._id).select('+password +mfaSecret +mfaRecoveryCodes');
    
    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ success: false, message: 'MFA is already disabled or user invalid.' });
    }

    let isAuthorized = false;

    // PATH 1: User provided their local password
    if (password && user.password) {
      isAuthorized = await bcrypt.compare(password, user.password);
      if (!isAuthorized) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
      }
    } 
    // PATH 2: User provided a TOTP or Recovery code
    else if (code && user.mfaSecret) {
      
      // Try to verify as standard TOTP first
      const unencryptedSecret = decrypt(user.mfaSecret);
      isAuthorized = speakeasy.totp.verify({
        secret: unencryptedSecret,
        encoding: 'base32',
        token: code,
        window: 1
      });

      // If it wasn't a standard 6 digit code, check if it's an 8 digit recovery match
      if (!isAuthorized && user.mfaRecoveryCodes && user.mfaRecoveryCodes.length > 0) {
        let matchedIndex = -1;
        for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
          const isMatch = await bcrypt.compare(code, user.mfaRecoveryCodes[i]);
          if (isMatch) {
            matchedIndex = i;
            break;
          }
        }
        if (matchedIndex !== -1) {
          isAuthorized = true;
          // We don't really strictly *need* to pull it since we're wiping them all anyway
        }
      }

      if (!isAuthorized) {
        return res.status(401).json({ success: false, message: 'Invalid TOTP or Recovery code.' });
      }
    } 
    // PATH 3: User did not provide anything
    else {
      return res.status(400).json({ 
        success: false, 
        message: 'You must provide either your password or an authenticator code to disable MFA.' 
      });
    }

    if (isAuthorized) {
      // Clear out the MFA data
      user.mfaEnabled = false;
      user.mfaSecret = null;
      user.mfaRecoveryCodes = [];
      user.mfaEnabledAt = null;

      await user.save();

      console.log(`[SECURITY AUDIT] User ${user._id} DISABLED MFA successfully.`);

      return res.status(200).json({ success: true, message: 'Multi-Factor Authentication has been successfully disabled.' });
    }

  } catch (err) {
    console.error('Disable MFA error:', err);
    res.status(500).json({ success: false, message: 'Server error disabling MFA.' });
  }
};

module.exports = { setupMfa, verifyEnableMfa, completeLoginMfa, recoveryLoginMfa, regenerateRecoveryCodes, disableMfa };
