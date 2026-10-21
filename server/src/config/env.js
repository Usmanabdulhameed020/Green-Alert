const envalid = require('envalid');
const { str, num, port } = envalid;

// Validates that all required environment variables are present at startup.
const env = envalid.cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development', choices: ['development', 'production', 'test'] }),
  PORT: port({ default: 5000 }),
  MONGODB_URI: str({ desc: 'MongoDB connection string' }),
  JWT_SECRET: str({ desc: 'JWT signing secret' }),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  CLOUDINARY_API_KEY: str({ default: '' }),
  CLOUDINARY_API_SECRET: str({ default: '' }),
  BCRYPT_SALT_ROUNDS: num({ default: 12 }),
  ADMIN_EMAIL: str({ default: '' }),
  ADMIN_PASSWORD: str({ default: '' }),
});

module.exports = env;
