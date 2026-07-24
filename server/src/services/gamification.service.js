const User = require('../models/User');
const Report = require('../models/Report');
const achievementsConfig = require('../config/achievements');

/**
 * Award XP to a user and save.
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<object>} { user, newlyUnlocked }
 */
async function awardXP(userId, amount) {
  const user = await User.findById(userId);
  if (!user) return { user: null, newlyUnlocked: [] };

  user.xp = (user.xp || 120) + amount;
  await user.save();

  const newlyUnlocked = await checkAndUnlockAchievements(user);
  return { user, newlyUnlocked };
}

/**
 * Evaluate all achievements for a user, unlock any newly earned ones.
 * @param {object} user - Mongoose user document
 * @returns {Promise<Array>} newlyUnlocked achievements
 */
async function checkAndUnlockAchievements(user) {
  const totalReports = await Report.countDocuments({ user: user._id });
  const resolvedReports = await Report.countDocuments({ user: user._id, status: 'Resolved' });
  const points = user.xp || 120;

  const newlyUnlocked = [];

  achievementsConfig.forEach((ach) => {
    if (user.unlockedAchievements.includes(ach.id)) return;

    let earned = false;
    switch (ach.type) {
      case 'reports': earned = totalReports >= ach.requirement; break;
      case 'resolved': earned = resolvedReports >= ach.requirement; break;
      case 'points': earned = points >= ach.requirement; break;
    }

    if (earned) {
      user.unlockedAchievements.push(ach.id);
      newlyUnlocked.push(ach);
    }
  });

  if (newlyUnlocked.length > 0) {
    await user.save();
  }

  return newlyUnlocked;
}

module.exports = { awardXP, checkAndUnlockAchievements };
