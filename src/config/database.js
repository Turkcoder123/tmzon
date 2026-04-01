const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const logger = require('../logger');

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected', { uri: MONGO_URI.replace(/\/\/.*@/, '//***@') });
    if (mongoose.connection) {
      mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
    }
  } catch (err) {
    logger.error('MongoDB connection error', { message: err.message });
    process.exit(1);
  }
}

module.exports = connectDB;
