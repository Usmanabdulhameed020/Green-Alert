const express = require('express');
const {
  getStats,
  getAllReports,
  getReportById,
  assignReport,
  getUsers,
  deleteUser,
  banUser,
  unbanUser,
  bulkBanUsers,
  getOrganizations,
  verifyOrganization,
  deleteOrganization,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/reports', getAllReports);
router.get('/reports/:id', getReportById);
router.patch('/reports/:id/assign', assignReport);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/ban', banUser);
router.patch('/users/:id/unban', unbanUser);
router.post('/users/bulk-ban', bulkBanUsers);
router.get('/organizations', getOrganizations);
router.patch('/organizations/:id/verify', verifyOrganization);
router.delete('/organizations/:id', deleteOrganization);

module.exports = router;
