const express = require('express');
const { getAllReports, getMyReports, getAgencyReports, getReportById, createReport, deleteReport, updateReportStatus } = require('../controllers/report.controller');
const { analyzeReport, getAnalysis, findDuplicates } = require('../controllers/ai.controller');
const { getComments, addComment, addReply } = require('../controllers/comment.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Report management endpoints
 */

const router = express.Router();

// Protect all routes in this router
router.use(protect);

// GET /api/reports (all community reports)
router.get('/', getAllReports);

// GET /api/reports/my-reports
router.get('/my-reports', getMyReports);

// GET /api/reports/agency-reports (agency only - returns reports assigned to their org)
router.get('/agency-reports', authorize('agency', 'admin'), getAgencyReports);

// GET /api/reports/:id
router.get('/:id', getReportById);

// POST /api/reports
router.post('/', createReport);

// DELETE /api/reports/:id
router.delete('/:id', deleteReport);

// PATCH /api/reports/:id/status
router.patch('/:id/status', authorize('agency', 'admin'), updateReportStatus);

// AI Analysis
router.post('/:id/analyze', analyzeReport);
router.get('/:id/analysis', getAnalysis);
router.get('/:id/find-duplicates', findDuplicates);

// Comments & Replies
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.post('/:id/comments/:commentId/replies', addReply);

module.exports = router;
