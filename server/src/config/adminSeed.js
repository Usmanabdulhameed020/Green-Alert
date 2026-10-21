const User = require('../models/User');

// Creates (or promotes) the admin account defined by ADMIN_EMAIL / ADMIN_PASSWORD.
const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seed.');
    return;
  }

  try {
    const existing = await User.findOne({ email }).select('+password');

    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log('Existing user promoted to admin role.');
      }
      const isMatch = await existing.comparePassword(password);
      if (!isMatch) {
        existing.password = password;
        await existing.save();
        console.log('Admin password updated.');
      }
      return;
    }

    await User.create({
      fullName: 'GreenAlert Administrator',
      email,
      password,
      role: 'admin',
    });

    console.log('Admin account created successfully.');
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
  }
};

module.exports = seedAdmin;
