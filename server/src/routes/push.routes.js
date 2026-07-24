const express = require('express');
const PushSubscription = require('../models/PushSubscription');
const { protect } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Push
 *   description: Push notification subscription endpoints
 */

const router = express.Router();
// VAPID public key endpoint — no auth needed (public key is public)
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(500).json({ success: false, message: 'VAPID public key not configured.' });
  }
  res.json({ success: true, publicKey });
});

// All push endpoints require authentication
router.use(protect);

/**
 * POST /api/push/subscribe
 * Save a new push subscription for the logged-in user.
 * Body: { endpoint, keys: { p256dh, auth } }
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Missing required subscription fields (endpoint, keys.p256dh, keys.auth).',
      });
    }

    // Check if this endpoint already exists for this user
    const existing = await PushSubscription.findOne({ endpoint });
    if (existing) {
      // Reactivate if it was deactivated
      if (!existing.active) {
        existing.active = true;
        await existing.save();
      }
      return res.status(200).json({ success: true, message: 'Subscription already exists.' });
    }

    await PushSubscription.create({
      user: req.user._id,
      endpoint,
      keys,
      userAgent: req.headers['user-agent'] || '',
    });

    return res.status(201).json({ success: true, message: 'Push subscription saved.' });
  } catch (error) {
    logger.error('Push subscribe error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/push/unsubscribe
 * Remove a push subscription (when user disables push notifications).
 * Body: { endpoint }
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Missing endpoint.' });
    }

    await PushSubscription.findOneAndDelete({ endpoint, user: req.user._id });

    return res.status(200).json({ success: true, message: 'Push subscription removed.' });
  } catch (error) {
    logger.error('Push unsubscribe error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/push/subscriptions
 * List all active subscriptions for the logged-in user.
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const subs = await PushSubscription.find({ user: req.user._id, active: true }).select('endpoint userAgent createdAt');
    return res.status(200).json({ success: true, data: subs });
  } catch (error) {
    logger.error('Get push subscriptions error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
