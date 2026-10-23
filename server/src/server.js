require('dotenv').config();
require('./config/env');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/database');
const seedAdmin = require('./config/adminSeed');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();

const shutdown = async (signal) => {
  console.log(`\n${signal} received - shutting down...`);
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
