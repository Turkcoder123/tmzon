const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = { generateToken, generateVerificationCode };
