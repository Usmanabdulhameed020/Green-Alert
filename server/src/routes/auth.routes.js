const express = require('express');
const multer = require('multer');
const { register, login, logout, getMe, updateProfile, deleteAccount, registerOrg, requestPasswordChangeCode, verifyPasswordChangeCode, changePassword, getLeaderboard, checkAchievements, sendVerificationEmail: sendVerification, verifyEmail, checkEmail } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators/auth.validator');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/check-email', checkEmail);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'), false);
    }
  }
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 */
router.post('/register', registerValidation, register);
/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', loginValidation, login);
/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logout successful }
 */
router.post('/logout', logout);
router.post('/register-org', upload.single('licenseDocument'), registerOrg);
/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: User profile data }
 *       401: { description: Not authenticated }
 */
router.get('/me', protect, getMe);
/**
 * @swagger
 * /api/v1/auth/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 *       401: { description: Not authenticated }
 */
router.patch('/me', protect, updateProfile);
router.delete('/me', protect, deleteAccount);
router.post('/request-password-change-code', requestPasswordChangeCode);
router.post('/verify-password-change-code', verifyPasswordChangeCode);
router.patch('/me/password', protect, changePassword);
/**
 * @swagger
 * /api/v1/auth/leaderboard:
 *   get:
 *     summary: Get user leaderboard
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Leaderboard data }
 */
router.get('/leaderboard', protect, getLeaderboard);
/**
 * @swagger
 * /api/v1/auth/check-achievements:
 *   post:
 *     summary: Check and award new achievements
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Achievements checked }
 */
router.post('/check-achievements', protect, checkAchievements);
/**
 * @swagger
 * /api/v1/auth/send-verification:
 *   post:
 *     summary: Send email verification code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Verification email sent }
 */
router.post('/send-verification', protect, sendVerification);
/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verify email with code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Invalid code }
 */
router.post('/verify-email', protect, verifyEmail);

module.exports = router;
