const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const logger = require('../config/logger');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yetkilendirme token gerekli' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Geçersiz token' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err) {
    logger.warn('Auth middleware error', { error: err.message });
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
};

module.exports = auth;
