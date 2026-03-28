const logger = require('../config/logger');

const errorHandler = (err, req, res, _next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Doğrulama hatası', details: messages });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Geçersiz ID formatı' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `Bu ${field} zaten kullanılıyor` });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Sunucu hatası' : err.message,
  });
};

module.exports = errorHandler;
