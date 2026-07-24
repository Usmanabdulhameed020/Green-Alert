const express = require('express');
const { getSettings, updateMaintenance, updateAnnouncement } = require('../controllers/system.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/settings', getSettings);
router.patch('/maintenance', protect, authorize('admin'), updateMaintenance);
router.patch('/announcement', protect, authorize('admin'), updateAnnouncement);

module.exports = router;