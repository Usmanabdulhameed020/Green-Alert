const express = require('express');
const { getNotifications, markAsRead, createNotification, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// GET /api/notifications (or /api/v1/notifications)
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read (or /api/v1/notifications/:id/read)
router.patch('/:id/read', markAsRead);

// POST /api/notifications (or /api/v1/notifications) - Helper to create notifications
router.post('/', createNotification);

// DELETE /api/notifications/:id (or /api/v1/notifications/:id)
router.delete('/:id', deleteNotification);

module.exports = router;
