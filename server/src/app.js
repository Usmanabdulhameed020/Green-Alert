const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const agencyRoutes = require('./routes/agency.routes');
const healthRoutes = require('./routes/health.routes');
const cloudinaryConfig = require('./config/cloudinary');

const app = express();

// Initialize Cloudinary with credentials from .env
cloudinaryConfig.configureCloudinary();

// Allow requests from the frontend
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes - everything lives under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/agency', agencyRoutes);
app.use('/api/v1', healthRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to GreenAlert API Server.', healthCheck: '/api/v1/health' });
});

// Final error handler - multer errors and anything else end up as JSON,
// so the frontend can show the message instead of an HTML error page.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
