const logger = require('../utils/logger');
const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const Community = require('../models/Community');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');
const { emitReportAssigned, emitNotification } = require('../services/socket.service');

exports.getStats = async (req, res) => {
  try {
    const [
      totalReports, totalUsers, totalOrgs, totalCommunities,
      reportsByStatus, reportsByMonth, recentReports,
      reportsByCategory, reportsByPriority,
      recentUsers, pendingOrganizations,
      criticalCount, unverifiedCount, pendingReviewCount, assignedCount,
    ] = await Promise.all([
      Report.countDocuments(),
      User.countDocuments(),
      Organization.countDocuments(),
      Community.countDocuments(),
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      Report.find().sort({ createdAt: -1 }).limit(10).populate('user', 'fullName email'),
      Report.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Report.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Organization.find({ verified: false }).sort({ createdAt: -1 }).limit(5).populate('user', 'fullName email'),
      Report.countDocuments({ priority: 'Critical', status: { $ne: 'Closed' } }),
      Organization.countDocuments({ verified: false }),
      Report.countDocuments({ status: 'Submitted' }),
      Report.countDocuments({ status: { $in: ['Assigned', 'In Progress'] } }),
    ]);

    const statusMap = {};
    reportsByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    const categoryMap = {};
    reportsByCategory.forEach((c) => { categoryMap[c._id] = c.count; });

    const priorityMap = {};
    reportsByPriority.forEach((p) => { priorityMap[p._id] = p.count; });

    return res.status(200).json({
      totalReports,
      pendingReports: (statusMap['Submitted'] || 0) + (statusMap['Under Review'] || 0),
      resolvedReports: statusMap['Resolved'] || 0,
      totalUsers,
      totalOrganizations: totalOrgs,
      verifiedOrganizations: await Organization.countDocuments({ verified: true }),
      totalCommunities,
      reportsByStatus: statusMap,
      reportsByMonth: reportsByMonth.map((r) => ({ month: r._id, count: r.count })),
      recentReports,
      reportsByCategory: categoryMap,
      reportsByPriority: priorityMap,
      recentUsers,
      pendingOrganizations,
      criticalCount,
      unverifiedCount,
      pendingReviewCount,
      assignedCount,
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'fullName email')
      .populate('assignedTo', 'name email category');

    const total = await Report.countDocuments();
    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', Math.ceil(total / limit));

    return res.status(200).json(reports);
  } catch (error) {
    logger.error('Admin get reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.assignReport = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    let org = null;
    if (organizationId) {
      org = await Organization.findById(organizationId);
      if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      report.assignedTo = org._id;
    } else {
      report.assignedTo = null;
    }

    await report.save();

    const populated = await Report.findById(report._id)
      .populate('user', 'fullName email')
      .populate('assignedTo', 'name email category');

    // Emit real-time event
    emitReportAssigned(populated);

    // Notify the org's user about the assignment
    try {
      if (org) {
        const orgUser = await User.findById(org.user);
        if (orgUser) {
          const notif = await Notification.create({
            user: orgUser._id,
            title: 'New Report Assigned',
            message: `Report "${report.title}" has been assigned to your organization (${org.name}).`,
            type: 'report_status',
            report: report._id,
          });
          emitNotification(notif);
        }
      }
    } catch (notifErr) {
      logger.error('Failed to create assignment notification:', notifErr.message);
    }

    // Send email to the agency about the newly assigned report
    try {
      if (org && report.assignedTo) {
        const citizenUser = populated.user;
        await emailService.sendReportAssignedToAgencyEmail(
          org.email,
          org.name,
          {
            title: populated.title,
            category: populated.category,
            priority: populated.priority,
            location: populated.location,
            description: populated.description
          },
          {
            fullName: citizenUser ? citizenUser.fullName : 'A citizen',
            email: citizenUser ? citizenUser.email : ''
          }
        );
        logger.info(`✅ Assignment email sent to agency: ${org.email}`);
      }
    } catch (emailErr) {
      logger.error('❌ Failed to send assignment email to agency:', emailErr.message);
    }

    // Send email to the citizen notifying them their report was assigned
    try {
      if (org && populated.user) {
        await emailService.sendReportAssignedToCitizenEmail(
          populated.user.email,
          populated.user.fullName,
          {
            title: populated.title,
            category: populated.category,
            location: populated.location
          },
          org.name
        );
        logger.info(`✅ Assignment notification email sent to citizen: ${populated.user.email}`);
      }
    } catch (emailErr) {
      logger.error('❌ Failed to send assignment email to citizen:', emailErr.message);
    }

    // Send push notification to the agency (if they have a user account)
    try {
      if (org && report.assignedTo && org.user) {
        const citizenUser = populated.user;
        await pushService.sendPushToUser(
          org.user._id || org.user,
          '📋 New Report Assigned',
          `A new report "${populated.title}" (${populated.category}) has been assigned to ${org.name}. Log in to take action.`,
          '/agency/reports'
        );
        logger.info(`✅ Assignment push notification sent to agency: ${org.name}`);
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send assignment push notification to agency:', pushErr.message);
    }

    // Send push notification to the citizen notifying them their report was assigned
    try {
      if (org && populated.user) {
        await pushService.sendPushToUser(
          populated.user._id,
          '📋 Report Assigned',
          `Your report "${populated.title}" (${populated.category}) has been assigned to ${org.name}. They will be in touch.`,
          '/citizen-dashboard/my-reports'
        );
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send assignment push notification to citizen:', pushErr.message);
    }

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Admin assign report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Admin get users error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin account' });
    }

    await Report.deleteMany({ user: user._id });
    await Organization.deleteMany({ user: user._id });
    await user.deleteOne();

    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    logger.error('Admin delete user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot ban an admin account' });
    }
    if (user.status === 'banned') {
      return res.status(400).json({ success: false, message: 'User is already banned' });
    }
    const reason = req.body.reason || '';
    user.status = 'banned';
    user.banReason = reason;
    user.bannedAt = new Date();
    user.bannedBy = req.user._id;
    await user.save();

    // Notify the banned user
    try {
      const notif = await Notification.create({
        user: user._id,
        title: 'Account Suspended',
        message: reason
          ? `Your account has been suspended. Reason: ${reason}`
          : 'Your account has been suspended by an administrator. You will not be able to log in until your account is restored.',
        type: 'system',
      });
      emitNotification(notif);
    } catch (notifErr) {
      logger.error('Failed to create ban notification:', notifErr.message);
    }

    // Push notification to the banned user
    try {
      pushService.sendPushToUser(
        user._id,
        'Account Suspended',
        reason
          ? `Your account was suspended. Reason: ${reason}`
          : 'Your account has been suspended by an administrator.',
        '/login'
      ).catch(() => {});
    } catch (pushErr) {
      logger.error('Failed to send ban push:', pushErr.message);
    }

    return res.status(200).json({ success: true, message: 'User banned successfully', user });
  } catch (error) {
    logger.error('Admin ban user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.status === 'active') {
      return res.status(400).json({ success: false, message: 'User is not banned' });
    }
    user.status = 'active';
    user.banReason = '';
    user.bannedAt = null;
    user.bannedBy = null;
    await user.save();

    // Notify the unbanned user
    try {
      const notif = await Notification.create({
        user: user._id,
        title: 'Account Restored',
        message: 'Your account has been restored by an administrator. You can now log in and access your dashboard.',
        type: 'system',
      });
      emitNotification(notif);
    } catch (notifErr) {
      logger.error('Failed to create unban notification:', notifErr.message);
    }

    // Push notification to the unbanned user
    try {
      pushService.sendPushToUser(
        user._id,
        '✅ Account Restored',
        'Your account has been restored. You can now log in.',
        '/citizen-dashboard'
      ).catch(() => {});
    } catch (pushErr) {
      logger.error('Failed to send unban push:', pushErr.message);
    }

    return res.status(200).json({ success: true, message: 'User unbanned successfully', user });
  } catch (error) {
    logger.error('Admin unban user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.bulkBanUsers = async (req, res) => {
  try {
    const { userIds, reason } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of user IDs' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, role: { $ne: 'admin' } },
      { $set: { status: 'banned', banReason: reason || '', bannedAt: new Date(), bannedBy: req.user._id } }
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} user(s) banned successfully`,
      count: result.modifiedCount,
    });
  } catch (error) {
    logger.error('Admin bulk ban error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.verified) filter.verified = req.query.verified === 'true';
    if (req.query.status) filter.status = req.query.status;

    const orgs = await Organization.find(filter)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json(orgs);
  } catch (error) {
    logger.error('Admin get orgs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.verifyOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id).populate('user', 'fullName email');
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    org.verified = true;
    org.status = 'Active';
    await org.save();

    // Send verification email to organization contact
    try {
      await emailService.sendOrgVerifiedEmail(org.email, org.name);
      logger.info(`✅ Verification email sent to ${org.email}`);
    } catch (emailErr) {
      logger.error('❌ Failed to send org verification email:', emailErr.message);
    }

    // Create notification for the org user
    try {
      if (org.user) {
        const notif = await Notification.create({
          user: org.user._id,
          title: 'Organization Verified',
          message: `Your organization "${org.name}" has been verified. You can now log in and access the agency portal.`,
          type: 'system',
        });
        emitNotification(notif);
      }
    } catch (notifErr) {
      logger.error('❌ Failed to create org verification notification:', notifErr.message);
    }

    // Send push notification to the org user
    try {
      if (org.user) {
        await pushService.sendPushToUser(
          org.user._id || org.user,
          '✅ Organization Verified',
          `Your organization "${org.name}" has been verified. You can now access the agency portal.`,
          '/agency'
        );
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send org verification push:', pushErr.message);
    }

    return res.status(200).json(org);
  } catch (error) {
    logger.error('Admin verify org error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'fullName email role avatar')
      .populate('assignedTo', 'name email category phone')
      .populate('aiDuplicateOf', 'title location')
      .populate('comments.user', 'fullName email role avatar')
      .populate('comments.replies.user', 'fullName email role avatar');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.status(200).json(report);
  } catch (err) {
    logger.error('Admin get report by ID error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Unassign reports assigned to this org
    await Report.updateMany({ assignedTo: org._id }, { assignedTo: null });

    // Delete the linked user account too
    await User.findByIdAndDelete(org.user);
    await org.deleteOne();

    return res.status(200).json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    logger.error('Admin delete org error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
