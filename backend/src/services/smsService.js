const config = require('../config');
const logger = require('../config/logger');

let twilioClient = null;

const getClient = () => {
  if (!twilioClient && config.twilio.accountSid && config.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return twilioClient;
};

const sendSMS = async (to, code) => {
  try {
    const client = getClient();
    if (!client) {
      logger.warn('Twilio not configured, skipping SMS');
      return;
    }
    await client.messages.create({
      body: `Tmzon doğrulama kodunuz: ${code}`,
      from: config.twilio.phoneNumber,
      to,
    });
    logger.info('SMS sent', { to });
  } catch (err) {
    logger.error('SMS send error', { error: err.message, to });
    throw new Error('SMS gönderilemedi');
  }
};

module.exports = { sendSMS };
