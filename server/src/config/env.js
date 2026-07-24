const envalid = require('envalid');
const { str, num, port } = envalid;
const logger = require('../utils/logger');

const env = envalid.cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development', choices: ['development', 'production', 'test'] }),
  PORT: port({ default: 5000 }),
  APP_NAME: str({ default: 'GreenAlert' }),
  SERVER_URL: str({ default: 'http://localhost:5000' }),
  CLIENT_URL: str({ default: 'http://localhost:5173' }),
  MONGODB_URI: str({ desc: 'MongoDB connection string' }),
  JWT_SECRET: str({ desc: 'JWT signing secret' }),
  JWT_EXPIRES_IN: str({ default: '700d' }),
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
  BREVO_API_KEY: str({ default: '' }),
  BREVO_SENDER_NAME: str({ default: 'GreenAlert' }),
  BREVO_SENDER_EMAIL: str({ default: '' }),
  VAPID_PUBLIC_KEY: str({ default: '' }),
  VAPID_PRIVATE_KEY: str({ default: '' }),
  GEMINI_API_KEY: str({ default: '' }),
  BCRYPT_SALT_ROUNDS: num({ default: 12 }),
  ADMIN_EMAIL: str({ default: '' }),
  ADMIN_PASSWORD: str({ default: '' }),
  ADMIN_PHONE: str({ default: '' }),
}, {
  strict: false,
  reporter: ({ errors }) => {
    if (Object.keys(errors).length > 0) {
      logger.error('Invalid environment variables:');
      for (const [key, err] of Object.entries(errors)) {
        logger.error(`   - ${key}: ${err.message}`);
      }
      process.exit(1);
    }
  },
});

module.exports = env;
