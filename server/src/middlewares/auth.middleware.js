const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Settings } = require('../models/Settings');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'You are not logged in! Please log in to get access.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token does no longer exist.' });
    }

    if (currentUser.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    }

    // Check maintenance mode — block all non-admin users
    if (currentUser.role !== 'admin') {
      const settings = await Settings.findOne();
      if (settings?.maintenanceMode) {
        return res.status(503).json({
          success: false,
          message: settings.maintenanceMessage || 'System is currently under maintenance.',
          maintenance: true,
        });
      }
    }

    req.user = currentUser;
    next();
  } catch (error) {
    logger.error('Auth protect middleware error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
};
