const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../logger');
const {
  MAX_SESSIONS,
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCK_MINUTES,
  APP_URL,
  MAGIC_LINK_EXPIRES_MINUTES,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} = require('../config/env');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateOTP,
  generateSecureToken,
  generateTokenFamily,
  generateDeviceId,
} = require('../utils/tokenUtils');
const { sendVerificationCode, sendPasswordResetEmail, sendMagicLinkEmail, sendNewDeviceAlert } = require('../utils/email');
const { sendPhoneOTP, verifyPhoneOTP } = require('../utils/phone');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDeviceInfo(req) {
  return {
    deviceName: String(req.body.deviceName || req.headers['x-device-name'] || 'Unknown Device'),
    deviceType: String(req.body.deviceType || req.headers['x-device-type'] || 'unknown'),
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
  };
}

/**
 * Create a session for the user, enforce max-session limit, return tokens.
 */
async function createSession(user, req) {
  const device = getDeviceInfo(req);
  const tokenFamily = generateTokenFamily();
  const deviceId = req.body.deviceId || generateDeviceId();

  // Check if this deviceId already has a session – replace it
  const existingIdx = user.sessions.findIndex((s) => s.deviceId === deviceId);
  if (existingIdx !== -1) {
    user.sessions.splice(existingIdx, 1);
  }

  // Enforce max sessions – evict oldest
  while (user.sessions.length >= MAX_SESSIONS) {
    const oldest = user.sessions.reduce((a, b) => (a.lastUsedAt < b.lastUsedAt ? a : b));
    user.sessions.pull(oldest._id);
  }

  const refreshToken = signRefreshToken(user._id, tokenFamily, deviceId);
  const refreshTokenHash = hashToken(refreshToken);

  user.sessions.push({
    deviceId,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    refreshTokenHash,
    tokenFamily,
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
    lastUsedAt: new Date(),
  });

  await user.save();

  const session = user.sessions.find((s) => s.deviceId === deviceId);
  const accessToken = signAccessToken(user, session._id.toString());

  // Alert about new device login (non-blocking)
  if (existingIdx === -1) {
    sendNewDeviceAlert(user.email, device.deviceName, device.ipAddress).catch(() => {});
  }

  return { accessToken, refreshToken, deviceId };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      logger.warn('Register failed: username or email taken', { username, email });
      return res.status(409).json({ message: 'Username or email already taken' });
    }

    const verificationCode = generateOTP();
    const user = await User.create({
      username,
      email,
      password,
      providers: ['local'],
      emailVerificationCode: hashToken(verificationCode),
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Send verification email (non-blocking)
    sendVerificationCode(email, verificationCode).catch((err) =>
      logger.error('Failed to send verification email', { email, error: err.message })
    );

    const tokens = await createSession(user, req);
    logger.info('User registered', { username, email });
    res.status(201).json({ ...tokens, user });
  } catch (err) {
    logger.error('Register error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login  (email + password)
// ---------------------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login failed: user not found', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check lockout
    if (user.isLocked()) {
      logger.warn('Login failed: account locked', { email });
      return res.status(423).json({ message: 'Account temporarily locked. Please try again later.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      await user.incLoginAttempts();
      // Lock account if too many attempts
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
        await user.save();
      }
      logger.warn('Login failed: invalid credentials', { email, attempts: user.loginAttempts });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await user.resetLoginAttempts();
    const tokens = await createSession(user, req);
    logger.info('User logged in', { username: user.username, email });
    res.json({ ...tokens, user });
  } catch (err) {
    logger.error('Login error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/google  (Google OAuth – receive id_token from client)
// ---------------------------------------------------------------------------
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    // Verify Google ID token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    } catch {
      return res.status(401).json({ message: 'Invalid Google token' });
    }
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link google if not yet linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.providers.includes('google')) user.providers.push('google');
        user.emailVerified = true;
        await user.save();
      }
    } else {
      // Create new user
      const baseUsername = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
      let username = baseUsername;
      const taken = await User.findOne({ username });
      if (taken) {
        username = `${baseUsername}${crypto.randomBytes(3).toString('hex')}`;
      }
      user = await User.create({
        username,
        email,
        googleId,
        emailVerified: true,
        avatar: picture || '',
        providers: ['google'],
      });
    }

    const tokens = await createSession(user, req);
    logger.info('Google auth', { username: user.username, email });
    res.json({ ...tokens, user });
  } catch (err) {
    logger.error('Google auth error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/phone/send-otp
// ---------------------------------------------------------------------------
exports.sendPhoneOTPHandler = async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    if (!phone) {
      return res.status(400).json({ message: 'phone is required' });
    }
    await sendPhoneOTP(phone);
    res.json({ message: 'OTP sent', phone });
  } catch (err) {
    logger.error('Phone OTP send error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/phone/verify-otp
// ---------------------------------------------------------------------------
exports.verifyPhoneOTPHandler = async (req, res) => {
  try {
    const phone = String(req.body.phone || '').trim();
    const code = String(req.body.code || '').trim();
    if (!phone || !code) {
      return res.status(400).json({ message: 'phone and code are required' });
    }

    const result = await verifyPhoneOTP(phone, code);
    if (result.status !== 'approved') {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      const baseUsername = `user${phone.replace(/\D/g, '').slice(-6)}`;
      let username = baseUsername;
      const taken = await User.findOne({ username });
      if (taken) {
        username = `${baseUsername}${crypto.randomBytes(3).toString('hex')}`;
      }
      // Generate a placeholder email if needed – phone-only users
      const placeholderEmail = `${phone.replace(/\D/g, '')}@phone.tmzon.local`;
      user = await User.create({
        username,
        email: placeholderEmail,
        phone,
        phoneVerified: true,
        providers: ['phone'],
      });
    } else {
      if (!user.phoneVerified) {
        user.phoneVerified = true;
        if (!user.providers.includes('phone')) user.providers.push('phone');
        await user.save();
      }
    }

    const tokens = await createSession(user, req);
    logger.info('Phone auth', { username: user.username, phone });
    res.json({ ...tokens, user });
  } catch (err) {
    logger.error('Phone OTP verify error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/verify-email
// ---------------------------------------------------------------------------
exports.verifyEmail = async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    if (!code) {
      return res.status(400).json({ message: 'code is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email already verified' });
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res.status(400).json({ message: 'No verification pending' });
    }
    if (user.emailVerificationExpires < Date.now()) {
      return res.status(410).json({ message: 'Verification code expired' });
    }
    if (user.emailVerificationCode !== hashToken(code)) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    logger.info('Email verified', { email: user.email });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    logger.error('Verify email error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/resend-verification
// ---------------------------------------------------------------------------
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email already verified' });

    const verificationCode = generateOTP();
    user.emailVerificationCode = hashToken(verificationCode);
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendVerificationCode(user.email, verificationCode);
    res.json({ message: 'Verification code sent' });
  } catch (err) {
    logger.error('Resend verification error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await User.findOne({ email });
    // Always return success to avoid email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = generateSecureToken();
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetUrl);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    logger.error('Forgot password error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const newPassword = String(req.body.password || '');
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'token, email and password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (
      !user ||
      !user.resetPasswordToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now() ||
      user.resetPasswordToken !== hashToken(token)
    ) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    if (!user.providers.includes('local')) user.providers.push('local');

    // Invalidate all sessions (security)
    user.sessions = [];
    await user.save();

    logger.info('Password reset', { email });
    res.json({ message: 'Password reset successfully. Please log in again.' });
  } catch (err) {
    logger.error('Reset password error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/magic-link/send
// ---------------------------------------------------------------------------
exports.sendMagicLink = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a magic link was sent.' });

    const token = generateSecureToken();
    user.magicLinkToken = hashToken(token);
    user.magicLinkExpires = new Date(Date.now() + MAGIC_LINK_EXPIRES_MINUTES * 60 * 1000);
    await user.save();

    const magicUrl = `${APP_URL}/magic-login?token=${token}&email=${encodeURIComponent(email)}`;
    await sendMagicLinkEmail(email, magicUrl);
    res.json({ message: 'If that email exists, a magic link was sent.' });
  } catch (err) {
    logger.error('Send magic link error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/magic-link/verify
// ---------------------------------------------------------------------------
exports.verifyMagicLink = async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!token || !email) {
      return res.status(400).json({ message: 'token and email are required' });
    }

    const user = await User.findOne({ email });
    if (
      !user ||
      !user.magicLinkToken ||
      !user.magicLinkExpires ||
      user.magicLinkExpires < Date.now() ||
      user.magicLinkToken !== hashToken(token)
    ) {
      return res.status(400).json({ message: 'Invalid or expired magic link' });
    }

    user.magicLinkToken = undefined;
    user.magicLinkExpires = undefined;
    user.emailVerified = true;
    await user.save();

    const tokens = await createSession(user, req);
    logger.info('Magic link login', { email });
    res.json({ ...tokens, user });
  } catch (err) {
    logger.error('Magic link verify error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const incomingHash = hashToken(refreshToken);
    const session = user.sessions.find((s) => s.tokenFamily === decoded.family);

    if (!session) {
      // Token family not found – might be reuse of revoked family; revoke all for safety
      logger.warn('Refresh token reuse detected (no family)', { userId: decoded.id });
      user.sessions = [];
      await user.save();
      return res.status(401).json({ message: 'Token reuse detected. All sessions revoked.' });
    }

    if (session.refreshTokenHash !== incomingHash) {
      // Token family exists but hash doesn't match – reuse detected; revoke the family
      logger.warn('Refresh token reuse detected', { userId: decoded.id, family: decoded.family });
      user.sessions.pull(session._id);
      await user.save();
      return res.status(401).json({ message: 'Token reuse detected. Session revoked.' });
    }

    // Rotate refresh token
    const newTokenFamily = session.tokenFamily; // keep the same family
    const newRefreshToken = signRefreshToken(user._id, newTokenFamily, session.deviceId);
    session.refreshTokenHash = hashToken(newRefreshToken);
    session.lastUsedAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user, session._id.toString());
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error('Refresh token error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout  (single device)
// ---------------------------------------------------------------------------
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sessionId = req.user.sessionId;
    if (sessionId) {
      user.sessions = user.sessions.filter((s) => s._id.toString() !== sessionId);
    }
    await user.save();
    logger.info('User logged out', { username: user.username, sessionId });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout-all  (all devices)
// ---------------------------------------------------------------------------
exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.sessions = [];
    await user.save();
    logger.info('User logged out all devices', { username: user.username });
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    logger.error('Logout all error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/sessions  (list active sessions)
// ---------------------------------------------------------------------------
exports.getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sessions = user.sessions.map((s) => ({
      _id: s._id,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: s._id.toString() === req.user.sessionId,
    }));
    res.json(sessions);
  } catch (err) {
    logger.error('Get sessions error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/auth/sessions/:sessionId  (revoke specific session)
// ---------------------------------------------------------------------------
exports.revokeSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const session = user.sessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    user.sessions.pull(session._id);
    await user.save();
    logger.info('Session revoked', { username: user.username, sessionId: req.params.sessionId });
    res.json({ message: 'Session revoked' });
  } catch (err) {
    logger.error('Revoke session error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/link-provider  (link Google/phone to existing account)
// ---------------------------------------------------------------------------
exports.linkProvider = async (req, res) => {
  try {
    const { provider } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (provider === 'google') {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ message: 'idToken is required' });

      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      let ticket;
      try {
        ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      } catch {
        return res.status(401).json({ message: 'Invalid Google token' });
      }
      const { sub: googleId } = ticket.getPayload();

      const existing = await User.findOne({ googleId });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'This Google account is linked to another user' });
      }
      user.googleId = googleId;
      if (!user.providers.includes('google')) user.providers.push('google');
      user.emailVerified = true;
    } else if (provider === 'phone') {
      const phone = String(req.body.phone || '').trim();
      const code = String(req.body.code || '').trim();
      if (!phone || !code) return res.status(400).json({ message: 'phone and code are required' });

      const result = await verifyPhoneOTP(phone, code);
      if (result.status !== 'approved') {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }

      const existing = await User.findOne({ phone });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'This phone number is linked to another user' });
      }
      user.phone = phone;
      user.phoneVerified = true;
      if (!user.providers.includes('phone')) user.providers.push('phone');
    } else if (provider === 'local') {
      const password = String(req.body.password || '');
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      user.password = password;
      if (!user.providers.includes('local')) user.providers.push('local');
    } else {
      return res.status(400).json({ message: 'Invalid provider. Supported: local, google, phone' });
    }

    await user.save();
    logger.info('Provider linked', { username: user.username, provider });
    res.json({ message: `${provider} linked successfully`, providers: user.providers });
  } catch (err) {
    logger.error('Link provider error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/unlink-provider  (unlink a provider)
// ---------------------------------------------------------------------------
exports.unlinkProvider = async (req, res) => {
  try {
    const { provider } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Must keep at least one provider
    if (user.providers.length <= 1) {
      return res.status(400).json({ message: 'Cannot unlink the only login method' });
    }

    if (provider === 'google') {
      user.googleId = undefined;
    } else if (provider === 'phone') {
      user.phone = undefined;
      user.phoneVerified = false;
    } else if (provider === 'local') {
      user.password = undefined;
    } else {
      return res.status(400).json({ message: 'Invalid provider' });
    }

    user.providers = user.providers.filter((p) => p !== provider);
    await user.save();
    logger.info('Provider unlinked', { username: user.username, provider });
    res.json({ message: `${provider} unlinked successfully`, providers: user.providers });
  } catch (err) {
    logger.error('Unlink provider error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    if (!user.providers.includes('local')) user.providers.push('local');
    await user.save();
    logger.info('Password changed', { username: user.username });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('Change password error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};
