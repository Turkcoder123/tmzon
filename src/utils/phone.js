const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID,
} = require('../config/env');
const logger = require('../logger');

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    logger.warn('Twilio not configured – phone OTP will be logged only');
    return null;
  }
  twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

/**
 * Send an OTP to a phone number via Twilio Verify.
 */
async function sendPhoneOTP(phoneNumber) {
  const client = getClient();
  if (!client) {
    logger.info('Phone OTP (not sent – no Twilio)', { phone: phoneNumber });
    return { status: 'pending', sid: 'mock' };
  }
  const verification = await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: phoneNumber, channel: 'sms' });
  logger.info('Phone OTP sent', { phone: phoneNumber, status: verification.status });
  return verification;
}

/**
 * Verify the OTP code for a phone number.
 */
async function verifyPhoneOTP(phoneNumber, code) {
  const client = getClient();
  if (!client) {
    logger.info('Phone OTP verify (mock – no Twilio)', { phone: phoneNumber, code });
    // In dev without Twilio, accept code "123456"
    return { status: code === '123456' ? 'approved' : 'pending', valid: code === '123456' };
  }
  const check = await client.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phoneNumber, code });
  logger.info('Phone OTP verified', { phone: phoneNumber, status: check.status });
  return check;
}

module.exports = { sendPhoneOTP, verifyPhoneOTP };
