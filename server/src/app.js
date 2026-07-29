const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const logger = require('./utils/logger');
const sanitize = require('./middlewares/sanitize.middleware');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const authGoogleRoutes = require('./routes/auth.google.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');
const communityRoutes = require('./routes/community.routes');
const postRoutes = require('./routes/post.routes');
const replyRoutes = require('./routes/reply.routes');
const pollRoutes = require('./routes/poll.routes');
const adminRoutes = require('./routes/admin.routes');
const agencyRoutes = require('./routes/agency.routes');
const pushRoutes = require('./routes/push.routes');
const systemRoutes = require('./routes/system.routes');
const chatRoutes = require('./routes/chat.routes');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimit.middleware');
const cloudinaryConfig = require('./config/cloudinary');
const brevoConfig = require('./config/brevo');
const geminiConfig = require('./config/gemini');
const pushConfig = require('./config/push');

const app = express();

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Initialize configuration integrations
cloudinaryConfig.configureCloudinary();
brevoConfig.configureBrevo();
pushConfig.configurePush();

// Start dynamic Gemini configuration in background
geminiConfig.configureGemini().catch((err) => {
  logger.error('❌ Failed to run background Gemini configuration:', err.message);
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    const allowed = [
      process.env.CLIENT_URL,
      'https://greenalert001.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(helmet());
app.use(sanitize);
app.use(compression());

// HTTP request logging
const morgan = require('morgan');
const stream = { write: (message) => logger.http(message.trim()) };
app.use(morgan('combined', { stream }));

// Serve static files (logo for emails, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GreenAlert API Docs',
}));

// REST Router registration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', authGoogleRoutes);
app.use('/api/v1', healthRoutes);

// Register report & notification routes on both /api and /api/v1 for reliability
app.use('/api/reports', reportRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/replies', replyRoutes);
app.use('/api/v1/replies', replyRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/v1/polls', pollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/v1/agency', agencyRoutes);

// Push notification subscription endpoints (free browser push)
app.use('/api/push', pushRoutes);
app.use('/api/v1/push', pushRoutes);

// System settings (maintenance mode, announcements)
app.use('/api/system', systemRoutes);
app.use('/api/v1/system', systemRoutes);

// AI Chatbot assistant
app.use('/api/chat', chatRoutes);
app.use('/api/v1/chat', chatRoutes);


// Root fallback route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GreenAlert API Server.',
    healthCheck: '/api/v1/health'
  });
});

module.exports = app;
