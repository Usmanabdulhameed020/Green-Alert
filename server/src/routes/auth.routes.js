const express = require('express');
const multer = require('multer');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  deleteAccount,
  registerOrg,
  changePassword,
  checkEmail,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'), false);
    }
  },
});

// Public routes
router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/register-org', upload.single('licenseDocument'), registerOrg);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);
router.delete('/me', protect, deleteAccount);
router.patch('/me/password', protect, changePassword);

module.exports = router;
