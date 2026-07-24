const Notification = require('../models/Notification');
const { emitNotification } = require('../services/socket.service');
const logger = require('../utils/logger');

/**
 * Get all notifications for the logged-in user
 * GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('report', 'title status');

    // Return the array directly as expected by the frontend
    return res.status(200).json(notifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a new notification (optional helper endpoint for testing/system use)
 * POST /api/notifications
 */
exports.createNotification = async (req, res) => {
  try {
    const { user, title, message, type, report } = req.body;
    
    if (!user || !title || !message) {
      return res.status(400).json({ success: false, message: 'Please provide user, title, and message' });
    }

    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      report
    });

    emitNotification(notification);

    return res.status(201).json(notification);
  } catch (error) {
    logger.error('Create notification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a notification (only by the owner)
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
