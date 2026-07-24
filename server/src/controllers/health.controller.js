const dbConfig = require('../config/database');
const cloudinaryConfig = require('../config/cloudinary');
const brevoConfig = require('../config/brevo');
const geminiConfig = require('../config/gemini');
const pushConfig = require('../config/push');

/**
 * Handles the production-ready health check request
 */
const checkHealth = async (req, res) => {
  try {
    const dbStatus = dbConfig.getStatus();
    const cloudinaryStatus = await cloudinaryConfig.checkStatus();
    const emailStatus = await brevoConfig.checkStatus();
    const pushStatus = pushConfig.isConfigured() ? 'ready' : 'disconnected';
    const aiStatus = await geminiConfig.checkStatus();

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 500).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbStatus,
      cloudinary: cloudinaryStatus,
      email: emailStatus,
      push: pushStatus,
      ai: aiStatus,
      uptime: `${process.uptime().toFixed(2)}s`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  checkHealth
};

