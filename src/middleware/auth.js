const { verifyAccessToken } = require('../utils/tokenUtils');
const logger = require('../logger');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    logger.warn('Auth failed: no token', { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    logger.warn('Auth failed: invalid/expired token', { url: req.url, method: req.method, ip: req.ip });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = auth;
