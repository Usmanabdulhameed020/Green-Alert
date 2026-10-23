const Report = require('../models/Report');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Aggregated system statistics for the admin dashboard
exports.getStats = async (req, res) => {
  try {
    const [
      totalReports, totalUsers, totalOrgs,
      reportsByStatus, reportsByMonth, recentReports,
      reportsByCategory, reportsByPriority,
      recentUsers, pendingOrganizations,
      criticalCount, unverifiedCount, pendingReviewCount, assignedCount,
    ] = await Promise.all([
      Report.countDocuments(),
      User.countDocuments(),
      Organization.countDocuments(),
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
    console.error('Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Paginated list of all users with search and role filters
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({ users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Remove the user's reports and, for agencies, their organization
    await Report.deleteMany({ user: user._id });
    if (user.organizationId) {
      await Organization.findByIdAndDelete(user.organizationId);
    }
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { banReason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'banned', banReason: banReason || '', bannedAt: new Date(), bannedBy: req.user._id },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Admin banUser error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', banReason: '', bannedAt: null, bannedBy: null },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('Admin unbanUser error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.bulkBanUsers = async (req, res) => {
  try {
    const { userIds, banReason } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of user IDs' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { status: 'banned', banReason: banReason || '', bannedAt: new Date(), bannedBy: req.user._id }
    );

    return res.status(200).json({ success: true, modified: result.modifiedCount });
  } catch (error) {
    console.error('Admin bulkBanUsers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Assign a report to an agency organization
exports.assignReport = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const reportId = req.params.id;

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const report = await Report.findByIdAndUpdate(
      reportId,
      { assignedTo: organizationId, status: 'Assigned' },
      { new: true }
    )
      .populate('user', 'fullName email')
      .populate('assignedTo', 'name email category phone');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    return res.status(200).json(report);
  } catch (error) {
    console.error('Admin assignReport error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find()
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email role status');

    return res.status(200).json(orgs);
  } catch (error) {
    console.error('Admin getOrganizations error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Approve an organization application
exports.verifyOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { verified: true, status: 'Active' },
      { new: true }
    );
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    return res.status(200).json(org);
  } catch (error) {
    console.error('Admin verifyOrganization error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    if (org.user) {
      await User.findByIdAndDelete(org.user);
    }

    return res.status(200).json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Admin deleteOrganization error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
