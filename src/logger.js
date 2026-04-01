const { NODE_ENV } = require('./config/env');

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info(msg, meta) {
    const line = meta
      ? `[${timestamp()}] INFO  ${msg} ${JSON.stringify(meta)}`
      : `[${timestamp()}] INFO  ${msg}`;
    console.log(line);
  },
  warn(msg, meta) {
    const line = meta
      ? `[${timestamp()}] WARN  ${msg} ${JSON.stringify(meta)}`
      : `[${timestamp()}] WARN  ${msg}`;
    console.warn(line);
  },
  error(msg, meta) {
    const line = meta
      ? `[${timestamp()}] ERROR ${msg} ${JSON.stringify(meta)}`
      : `[${timestamp()}] ERROR ${msg}`;
    console.error(line);
  },
  debug(msg, meta) {
    if (NODE_ENV !== 'production') {
      const line = meta
        ? `[${timestamp()}] DEBUG ${msg} ${JSON.stringify(meta)}`
        : `[${timestamp()}] DEBUG ${msg}`;
      console.log(line);
    }
  },
};

module.exports = logger;
