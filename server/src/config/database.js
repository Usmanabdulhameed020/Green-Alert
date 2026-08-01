const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Establishes a connection to MongoDB Atlas
 */
const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  try {
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    logger.info('Database connected successfully.');
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err.message);
    throw err;
  }
};

/**
 * Returns current Mongoose connection status string
 * @returns {string}
 */
const getStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'disconnected';
};

module.exports = {
  connectDB,
  getStatus
};
