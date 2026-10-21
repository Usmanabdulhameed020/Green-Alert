const express = require('express');
const {
  getAgencyStats,
  getOrgProfile,
  updateOrgProfile,
  updateReportStatus,
} = require('../controllers/agency.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('agency'));

router.get('/stats', getAgencyStats);
router.get('/org', getOrgProfile);
router.patch('/org', updateOrgProfile);
router.patch('/reports/:id/status', updateReportStatus);

module.exports = router;
