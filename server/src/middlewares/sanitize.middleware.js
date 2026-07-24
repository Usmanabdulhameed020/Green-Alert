const sanitizeValue = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeValue(obj[key]);
    }
  }
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeValue(req.body);
  }
  next();
};

module.exports = sanitizeMiddleware;
