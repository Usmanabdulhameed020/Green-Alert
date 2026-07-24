/**
 * Web Push / VAPID configuration for free browser push notifications.
 *
 * VAPID keys are a public/private key pair used to identify
 * the application server to the browser's push service.
 * They are completely free and self-generated — no third-party service required.
 */

const logger = require('../utils/logger');
const webpush = require('web-push');

// VAPID keys are generated once and saved in .env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

const isConfigured = () => !!(publicVapidKey && privateVapidKey);

const configurePush = () => {
  if (!isConfigured()) {
    logger.warn('⚠️  VAPID keys not found in .env. Push notifications will be disabled.');
    logger.warn('   Run: node src/config/push.js  to generate keys.');
    return;
  }

  webpush.setVapidDetails(
    `mailto:${process.env.BREVO_SENDER_EMAIL || 'admin@greenalert.com'}`,
    publicVapidKey,
    privateVapidKey
  );

  logger.info('📡 Web Push (VAPID) configured successfully — free browser push notifications ready!');
};

// Run directly: `node src/config/push.js` to generate VAPID keys
if (require.main === module) {
  const keys = webpush.generateVAPIDKeys();
  logger.info('\n🔑 Add these to your .env file:\n');
  logger.info(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
  logger.info(`VAPID_PRIVATE_KEY=${keys.privateKey}\n`);
}

module.exports = { configurePush, publicVapidKey, isConfigured };
