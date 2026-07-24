const rateLimit = require('express-rate-limit');

const isLocalRequest = (req) => {
  const ip = req.ip || '';
  const hostname = req.hostname || '';
  return hostname === 'localhost' || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1');
};

const createLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    skip: (req) => process.env.NODE_ENV !== 'production' && isLocalRequest(req),
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
);

const authLimiter = createLimiter(
  parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 900000,
  parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 20 : 100)
);

module.exports = { apiLimiter, authLimiter };
