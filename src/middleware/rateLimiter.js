const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Lenient auth rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // lenient
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // lenient
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Slow down auth endpoints progressively (lenient)
const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 20, // start slowing after 20 requests
  delayMs: (hits) => (hits - 20) * 200, // progressive delay
});

module.exports = { authLimiter, apiLimiter, authSlowDown };
