const express = require('express');
const {
  getAllReports,
  getMyReports,
  getAgencyReports,
  getReportById,
  createReport,
  deleteReport,
  updateReportStatus,
} = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Every report route requires you to be logged in
router.use(protect);

router.get('/', getAllReports);
router.get('/my-reports', getMyReports);
router.get('/agency-reports', authorize('agency', 'admin'), getAgencyReports);
router.post('/', createReport);
router.get('/:id', getReportById);
router.delete('/:id', deleteReport);
router.patch('/:id/status', authorize('agency', 'admin'), updateReportStatus);

module.exports = router;
