const User = require('../models/User');
const Organization = require('../models/Organization');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../config/cloudinary');

// Creates a JWT that identifies the user. We only put the user's id in it.
const signToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Signs a token, sets it as a cookie, and sends the user back.
const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
      },
    },
  });
};

exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your name, email and password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'This email is reserved. Contact support.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const newUser = await User.create({ fullName, email, password });
    createSendToken(newUser, 201, res, 'Registration successful');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [existingUser, existingOrg] = await Promise.all([
      User.findOne({ email: cleanEmail }),
      Organization.findOne({ email: cleanEmail }),
    ]);

    return res.status(200).json({ success: true, exists: !!(existingUser || existingOrg) });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'banned') {
      const reason = user.banReason ? ` Reason: ${user.banReason}` : '';
      return res.status(403).json({ success: false, message: `Your account has been suspended. Contact support.${reason}` });
    }

    // Agency accounts must be verified by an admin before they can log in.
    if (user.role === 'agency') {
      if (!user.organizationId) {
        return res.status(403).json({ success: false, message: 'Your organization is not linked. Contact support.' });
      }
      const org = await Organization.findById(user.organizationId);
      if (!org || !org.verified) {
        return res.status(403).json({
          success: false,
          message: 'Your organization account is awaiting admin verification.',
          awaitingVerification: true,
        });
      }
    }

    createSendToken(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
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
          settings: user.settings || {},
        },
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
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
          settings: user.settings || {},
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    // An agency account also owns an organization record
    if (req.user.organizationId) {
      await Organization.findByIdAndDelete(req.user.organizationId);
    }
    await Report.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
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
            { folder: 'greenalert/licenses', resource_type: 'auto' },
            (error, result) => (error ? reject(error) : resolve(result.secure_url))
          );
          stream.end(req.file.buffer);
        });
      } catch (uploadError) {
        console.error('License document upload error:', uploadError);
      }
    }

    const user = await User.create({ fullName: orgName, email, password, role: 'agency' });

    // If the organization cannot be created, remove the agency user so it
    // never gets stuck without an organization (which would block login).
    let organization;
    try {
      organization = await Organization.create({
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
    } catch (orgError) {
      await User.findByIdAndDelete(user._id);
      console.error('Organization create error:', orgError);
      return res.status(409).json({ success: false, message: 'Organization name already registered' });
    }

    user.organizationId = organization._id;
    await user.save();

    createSendToken(user, 201, res, 'Organization registered. Awaiting admin verification.');
  } catch (error) {
    console.error('Register org error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
