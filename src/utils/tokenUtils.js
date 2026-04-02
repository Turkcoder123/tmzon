const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
} = require('../config/env');

/**
 * Sign a short-lived access token (15 min default).
 */
function signAccessToken(user, sessionId) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, sessionId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Sign a long-lived refresh token (30 days default).
 * Includes tokenFamily for rotation & reuse detection.
 */
function signRefreshToken(userId, tokenFamily, sessionId) {
  const jti = uuidv4();
  return jwt.sign(
    { id: userId.toString(), family: tokenFamily, jti, sessionId },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

/**
 * Verify an access token.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Verify a refresh token.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

/**
 * Hash a token (for storing refresh tokens in DB).
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a random 6-digit code.
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a secure random hex token.
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique token family ID.
 */
function generateTokenFamily() {
  return uuidv4();
}

/**
 * Generate a device ID.
 */
function generateDeviceId() {
  return uuidv4();
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateOTP,
  generateSecureToken,
  generateTokenFamily,
  generateDeviceId,
};
