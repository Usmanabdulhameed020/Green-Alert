const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A notification must belong to a user'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
    },
    message: {
      type: String,
      required: [true, 'Please provide a message'],
    },
    type: {
      type: String,
      enum: ['report_status', 'system', 'alert', 'community'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for 'id' to map to '_id' for frontend compatibility
notificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
