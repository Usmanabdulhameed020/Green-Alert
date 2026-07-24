const User = require('../models/User');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  logger.info('Admin seed check:', { email: !!email, password: !!password });

  if (!email || !password || email === '' || password === '') {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set or empty. Skipping admin seed.');
    return;
  }

  try {
    const existing = await User.findOne({ email }).select('+password');
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        logger.info('Existing user promoted to admin role.');
      }
      // Update password if it changed
      const isMatch = await existing.comparePassword(password);
      if (!isMatch) {
        existing.password = password;
        await existing.save();
        logger.info('Admin password updated.');
      }
      return;
    }

    await User.create({
      fullName: 'GreenAlert Administrator',
      email,
      password,
      role: 'admin',
      isVerified: true,
    });

    logger.info('Admin account created successfully.');
  } catch (error) {
    logger.error('Failed to seed admin:', error.message);
  }
};

module.exports = seedAdmin;
