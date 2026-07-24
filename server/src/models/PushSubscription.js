const mongoose = require('mongoose');

/**
 * PushSubscription model
 * Stores browser push notification subscriptions per user.
 * Each user can have multiple devices/browsers subscribed.
 */
const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A push subscription must belong to a user'],
      index: true,
    },
    endpoint: {
      type: String,
      required: [true, 'Push endpoint is required'],
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
module.exports = PushSubscription;
