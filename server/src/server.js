require('dotenv').config();
require('./config/env');
const http = require('http');
const { Server } = require('socket.io');
const { initSocket } = require('./services/socket.service');
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const seedAdmin = require('./config/adminSeed');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

initSocket(io);

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🏥 Health check endpoint: http://localhost:${PORT}/api/v1/health`);
      logger.info(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    logger.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

const shutdown = async (signal) => {
  logger.info(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
