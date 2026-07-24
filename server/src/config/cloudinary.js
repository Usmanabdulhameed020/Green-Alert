const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Export the configured cloudinary instance for use in upload routes
let cloudinaryInstance = cloudinary;

/**
 * Configures Cloudinary connection settings
 */
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn('Cloudinary configuration missing.');
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  return true;
};

/**
 * Checks Cloudinary API health
 * @returns {Promise<string>} Connection status ('connected' or 'disconnected')
 */
const checkStatus = async () => {
  try {
    const res = await cloudinary.api.ping();
    return res && res.status === 'ok' ? 'connected' : 'disconnected';
  } catch (err) {
    return 'disconnected';
  }
};

module.exports = {
  configureCloudinary,
  checkStatus,
  cloudinary: cloudinaryInstance
};
