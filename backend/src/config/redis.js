const Redis = require('ioredis');
const config = require('./index');
const logger = require('./logger');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));

module.exports = redis;
