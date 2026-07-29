const User = require('../models/User');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const ms = require('ms');

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

exports.googleLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Google access token is required' });
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
    }

    const userInfo = await response.json();
    const { email, name, picture, sub } = userInfo;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account has no email address' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.status === 'banned') {
        let banReason = '';
        if (user.banReason) banReason = ` Reason: ${user.banReason}`;
        return res.status(403).json({ success: false, message: `Your account has been suspended. Contact support.${banReason}` });
      }

      user.avatar = picture || user.avatar;
      await user.save();

      return createSendToken(user, 200, res, 'Login successful');
    }

    if (email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'This email is reserved. Contact support.' });
    }

    const tempPassword = sub + Math.random().toString(36).slice(2);
    user = await User.create({
      fullName: name || email.split('@')[0],
      email,
      password: tempPassword,
      avatar: picture || '',
      isVerified: true,
      role: 'citizen',
    });

    return createSendToken(user, 201, res, 'Registration successful');
  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};
