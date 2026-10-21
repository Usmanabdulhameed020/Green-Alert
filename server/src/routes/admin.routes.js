const express = require('express');
const {
  getStats,
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
const { getAllReports, getReportById } = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Every admin route requires a logged-in admin
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
