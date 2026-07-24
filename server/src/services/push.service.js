/**
 * Free Browser Push Notification Service
 *
 * Uses the Web Push API (VAPID) — completely free, no paid API needed.
 * Browsers provide the push infrastructure at no cost.
 *
 * How it works:
 * 1. User's browser registers a Service Worker (background script)
 * 2. Browser generates a unique Push Subscription (endpoint + keys)
 * 3. Subscription is saved in the database linked to the user
 * 4. Server uses `web-push` library to send encrypted push messages
 * 5. Browser's built-in push service delivers the message
 * 6. Service Worker catches the event and shows a browser notification
 */

const PushSubscription = require('../models/PushSubscription');
const logger = require('../utils/logger');

/**
 * Send a push notification to a specific user across all their devices.
 * @param {string} userId - The user's MongoDB ObjectId
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {string} [url] - Optional URL to open when clicked
 * @returns {Promise<number>} Number of successful deliveries
 */
const sendPushToUser = async (userId, title, body, url = null) => {
  let webpush;
  try {
    webpush = require('web-push');
  } catch {
    logger.warn('web-push not installed — push notification skipped.');
    return 0;
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn('VAPID keys not configured — push notification skipped.');
    return 0;
  }

  // Find all active subscriptions for this user
  const subscriptions = await PushSubscription.find({ user: userId, active: true });
  if (!subscriptions.length) return 0;

  webpush.setVapidDetails(
    `mailto:${process.env.BREVO_SENDER_EMAIL || 'admin@greenalert.com'}`,
    vapidPublicKey,
    vapidPrivateKey
  );

  const payload = JSON.stringify({
    title,
    body,
    url,
    icon: '/GreenAlert Logo.png',
    badge: '/GreenAlert Logo.png',
    timestamp: Date.now(),
  });

  let successCount = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        payload
      );
      successCount++;
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription expired or unsubscribed — clean it up
        logger.info(`Removing expired push subscription: ${sub._id}`);
        await PushSubscription.findByIdAndDelete(sub._id);
      } else {
        logger.error(`Push send error (${sub._id}): ${err.message}`);
      }
    }
  }

  if (successCount > 0) {
    logger.info(`Push notification sent to user ${userId} on ${successCount} device(s)`);
  }

  return successCount;
};

/**
 * Send push notification to all admin users.
 * @param {string} title
 * @param {string} body
 * @param {string} [url]
 */
const sendPushToAdmins = async (title, body, url = null) => {
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin' });
  let total = 0;
  for (const admin of admins) {
    total += await sendPushToUser(admin._id, title, body, url);
  }
  return total;
};

module.exports = {
  sendPushToUser,
  sendPushToAdmins,
};
