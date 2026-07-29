const logger = require('../utils/logger');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const { validationResult } = require('express-validator');
const emailService = require('../services/email.service');
const achievementsConfig = require('../config/achievements');
const { checkAndUnlockAchievements } = require('../services/gamification.service');
const { Settings } = require('../models/Settings');
const { cloudinary } = require('../config/cloudinary');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user);
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const maxAge = typeof ms(expiresIn) === 'number' ? ms(expiresIn) : 7 * 24 * 60 * 60 * 1000;

  const cookieOptions = {
    expires: new Date(Date.now() + maxAge),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('token', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        phone: user.phone || '',
        organizationId: user.organizationId || undefined,
        xp: user.xp || 120,
        unlockedAchievements: user.unlockedAchievements || [],
      },
    },
  });
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { fullName, email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'This email is reserved. Contact support.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const newUser = await User.create({ fullName, email, password });

    // Send welcome email in background using Brevo
    emailService.sendWelcomeEmail(newUser.email, newUser.fullName).catch((err) => {
      logger.error('❌ Failed to send welcome email via Brevo:', err.message || err);
    });

    createSendToken(newUser, 201, res, 'Registration successful');
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      let banReason = '';
      if (user.banReason) banReason = ` Reason: ${user.banReason}`;
      return res.status(403).json({ success: false, message: `Your account has been suspended. Contact support.${banReason}` });
    }

    // Check maintenance mode — block non-admin users from logging in
    if (user.role !== 'admin') {
      const settings = await Settings.findOne();
      if (settings?.maintenanceMode) {
        return res.status(503).json({
          success: false,
          message: settings.maintenanceMessage || 'System is currently under maintenance.',
          maintenance: true,
        });
      }
    }

    // Agency accounts must be verified by an admin before they can log in
    if (user.role === 'agency') {
      if (!user.organizationId) {
        return res.status(403).json({ success: false, message: 'Your organization is not linked. Contact support.' });
      }
      const org = await Organization.findById(user.organizationId);
      if (!org || !org.verified) {
        return res.status(403).json({
          success: false,
          message: 'Your organization account is awaiting admin verification. You will be notified once approved.',
          awaitingVerification: true,
        });
      }
    }

    createSendToken(user, 200, res, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar || '',
          organizationId: user.organizationId || undefined,
          xp: user.xp || 120,
          settings: user.settings || {},
        },
      },
    });
  } catch (error) {
    logger.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatar, settings } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    if (settings !== undefined) updates.settings = settings;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar || '',
          xp: user.xp || 120,
          settings: user.settings || {},
        },
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await Report.deleteMany({ user: userId });

    await User.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.registerOrg = async (req, res) => {
  try {
    const { orgName, description, email, phone, address, website, category, licenseNumber, password } = req.body;

    if (!orgName || !description || !email || !phone || !address || !category || !password) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    if (email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'This email is reserved.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const existingOrg = await Organization.findOne({ name: orgName });
    if (existingOrg) {
      return res.status(409).json({ success: false, message: 'Organization name already registered' });
    }

    let licenseDocumentUrl = '';
    if (req.file) {
      try {
        licenseDocumentUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'greenalert/licenses',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(req.file.buffer);
        });
      } catch (uploadError) {
        logger.error('License document upload error:', uploadError);
      }
    }

    const user = await User.create({
      fullName: orgName,
      email,
      password,
      role: 'agency',
      isVerified: false,
    });

    const organization = await Organization.create({
      name: orgName,
      description,
      email,
      phone,
      address,
      website: website || '',
      category,
      licenseNumber: licenseNumber || '',
      licenseDocument: licenseDocumentUrl,
      verified: false,
      status: 'Inactive',
      user: user._id,
    });

    user.organizationId = organization._id;
    await user.save();

    createSendToken(user, 201, res, 'Organization registered successfully. Awaiting admin verification.');
  } catch (error) {
    logger.error('Register org error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.requestPasswordChangeCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email address' });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.passwordChangeCode = code;
    user.passwordChangeCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send confirmation code email in background
    emailService.sendPasswordChangeCodeEmail(user.email, user.fullName, code).catch((err) => {
      logger.error('Failed to send password change code email:', err.message || err);
    });

    return res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (error) {
    logger.error('Request password change code error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.verifyPasswordChangeCode = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email address' });
    }

    // Check code and expiration
    if (
      !user.passwordChangeCode ||
      user.passwordChangeCode !== code ||
      new Date() > user.passwordChangeCodeExpires
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangeCode = '';
    user.passwordChangeCodeExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Verify password change code error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/v1/auth/leaderboard
 * Returns top citizens sorted by XP
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;

    const users = await User.find({ role: 'citizen' })
      .select('fullName avatar xp unlockedAchievements')
      .sort({ xp: -1 })
      .limit(limit)
      .lean();

    // Get report counts for each user
    const userIds = users.map(u => u._id);
    const reportCounts = await Report.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    reportCounts.forEach(r => { countMap[r._id.toString()] = r.count; });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      _id: u._id,
      fullName: u.fullName,
      avatar: u.avatar || '',
      xp: u.xp || 120,
      reportCount: countMap[u._id.toString()] || 0,
      achievementCount: (u.unlockedAchievements || []).length,
    }));

    return res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    logger.error('Leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v1/auth/check-achievements
 * Evaluate achievements for the current user, unlock new ones
 */
exports.checkAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newlyUnlocked = await checkAndUnlockAchievements(user);

    return res.status(200).json({
      success: true,
      data: {
        newlyUnlocked,
        allAchievements: achievementsConfig.map((ach) => ({
          ...ach,
          unlocked: user.unlockedAchievements.includes(ach.id),
        })),
        unlockedAchievements: user.unlockedAchievements,
      },
    });
  } catch (error) {
    logger.error('Check achievements error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationCode = code;
    user.emailVerificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const logoUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/logo.png`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="${logoUrl}" alt="GreenAlert" style="height: 50px; width: auto;" />
          <h1 style="margin: 10px 0 0 0;">GreenAlert</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p style="color: #555; font-size: 16px;">Hello ${user.fullName},</p>
          <p style="color: #555; font-size: 16px;">Use the following code to verify your email address:</p>
          <div style="background-color: #fff; border: 2px dashed #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #999; font-size: 14px;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;

    emailService.sendEmail({ to: user.email, subject: 'GreenAlert - Verify Your Email', htmlContent }).catch((err) => {
      logger.error('Failed to send verification email:', err.message || err);
    });

    return res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (error) {
    logger.error('Send verification email error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const user = await User.findOne({
      emailVerificationCode: code,
      emailVerificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    user.isVerified = true;
    user.emailVerificationCode = '';
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
