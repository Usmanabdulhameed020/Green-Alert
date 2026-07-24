const express = require('express');
const { getAgencyStats, getAnalytics, updateOrgProfile, getOrgProfile, updateReportStatus } = require('../controllers/agency.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Agency
 *   description: Agency management endpoints
 */

const router = express.Router();

router.use(protect);
router.use(authorize('agency', 'admin'));

router.get('/stats', getAgencyStats);
router.get('/analytics', getAnalytics);
router.get('/org', getOrgProfile);
router.patch('/org', updateOrgProfile);
router.patch('/reports/:id/status', updateReportStatus);

module.exports = router;
