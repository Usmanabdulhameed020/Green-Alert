const logger = require('../utils/logger');
const Report = require('../models/Report');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');
const { emitReportStatusChanged, emitNotification } = require('../services/socket.service');

exports.getAgencyStats = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const [
      reports,
      reportsByCategory,
      reportsByPriority,
      reportsByMonth,
      recentReports,
    ] = await Promise.all([
      Report.find({ assignedTo: orgId }),
      Report.aggregate([
        { $match: { assignedTo: orgId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.aggregate([
        { $match: { assignedTo: orgId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: { assignedTo: orgId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      Report.find({ assignedTo: orgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'fullName email'),
    ]);

    const total = reports.length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const assigned = reports.filter((r) => r.status === 'Assigned').length;
    const closed = reports.filter((r) => r.status === 'Closed').length;
    const submitted = reports.filter((r) => r.status === 'Submitted').length;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = reports.filter((r) => new Date(r.createdAt) >= weekAgo).length;

    const categoryMap = {};
    reportsByCategory.forEach((c) => { categoryMap[c._id] = c.count; });

    const priorityMap = {};
    reportsByPriority.forEach((p) => { priorityMap[p._id] = p.count; });

    return res.status(200).json({
      totalAssigned: total,
      inProgress,
      resolved,
      assigned,
      closed,
      submitted,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      newThisWeek,
      reportsByCategory: categoryMap,
      reportsByPriority: priorityMap,
      reportsByMonth: reportsByMonth.map((r) => ({ month: r._id, count: r.count })),
      recentReports,
    });
  } catch (error) {
    logger.error('Agency stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const reports = await Report.find({ assignedTo: organizationId }).populate('user', 'fullName email');

    const totalReports = reports.length;
    const resolvedReports = reports.filter((r) => r.status === 'Resolved' || r.status === 'Closed').length;
    const inProgressReports = reports.filter((r) => r.status === 'In Progress').length;
    const pendingReports = reports.filter((r) => r.status === 'Pending' || r.status === 'Submitted' || r.status === 'Assigned').length;

    const resolvedTimes = reports
      .filter((r) => (r.status === 'Resolved' || r.status === 'Closed') && r.updatedAt && r.createdAt)
      .map((r) => new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime());
    const averageResolutionTime = resolvedTimes.length > 0
      ? Math.round(resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length / (1000 * 60 * 60 * 24))
      : 0;

    const reportsByCategory = {};
    reports.forEach((r) => {
      const cat = r.category || 'Uncategorized';
      reportsByCategory[cat] = (reportsByCategory[cat] || 0) + 1;
    });

    const now = new Date();
    const reportsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      const created = reports.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      }).length;
      const resolved = reports.filter((r) => {
        if (r.status !== 'Resolved' && r.status !== 'Closed') return false;
        const rd = new Date(r.updatedAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      }).length;
      reportsByMonth.push({ month: monthLabel, monthKey, created, resolved });
    }

    const recentActivity = reports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((r) => ({
        _id: r._id,
        title: r.title,
        category: r.category,
        status: r.status,
        priority: r.priority,
        location: r.location,
        createdAt: r.createdAt,
        user: r.user ? { fullName: r.user.fullName } : null,
      }));

    return res.status(200).json({
      totalReports,
      resolvedReports,
      inProgressReports,
      pendingReports,
      averageResolutionTime,
      reportsByCategory,
      reportsByMonth,
      recentActivity,
    });
  } catch (error) {
    logger.error('Agency analytics error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateOrgProfile = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const { description, phone, address, website } = req.body;
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (website !== undefined) updates.website = website;

    const org = await Organization.findByIdAndUpdate(orgId, updates, { new: true, runValidators: true });
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    return res.status(200).json({ success: true, message: 'Organization profile updated', data: org });
  } catch (error) {
    logger.error('Update org profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getOrgProfile = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    return res.status(200).json(org);
  } catch (error) {
    logger.error('Get org profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const validStatuses = ['In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const report = await Report.findById(req.params.id).populate('user');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot change status of a closed report' });
    }

    if (!report.assignedTo || report.assignedTo.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: 'This report is not assigned to your agency' });
    }

    report.status = status;
    if (req.body.resolutionImages && Array.isArray(req.body.resolutionImages)) {
      report.resolutionImages = req.body.resolutionImages;
    }
    if (req.body.resolutionNotes) {
      report.resolutionNotes = req.body.resolutionNotes;
    }
    if (status === 'Resolved' || status === 'Closed') {
      report.resolvedAt = new Date();
    }
    await report.save();

    const populated = await Report.findById(report._id)
      .populate('user', 'fullName email')
      .populate('assignedTo', 'name email category');

    emitReportStatusChanged(populated);

    try {
      if (report.user) {
        const notif = await Notification.create({
          user: report.user._id,
          title: 'Report Status Updated',
          message: `Your report "${report.title}" status has been updated to "${status}" by your assigned agency.`,
          type: 'report_status',
          report: report._id,
        });
        emitNotification(notif);
      }
    } catch (notifErr) {
      logger.error('Failed to create notification:', notifErr.message);
    }

    // Send status update email to the citizen
    try {
      if (report.user) {
        await emailService.sendReportStatusEmail(
          report.user.email,
          report.user.fullName,
          report.title,
          status,
          report.category
        );
        logger.info(`✅ Status update email sent to citizen: ${report.user.email}`);
      }
    } catch (emailErr) {
      logger.error('❌ Failed to send status update email to citizen:', emailErr.message);
    }

    // Send status update alert email to the admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && report.user) {
        const agencyOrg = await Organization.findById(orgId).select('name');
        await emailService.sendAdminStatusUpdateAlert(
          adminEmail,
          { title: report.title, category: report.category, priority: report.priority, location: report.location },
          status,
          agencyOrg ? agencyOrg.name : 'Agency',
          { fullName: report.user.fullName, email: report.user.email }
        );
        logger.info(`✅ Status update alert sent to admin: ${adminEmail}`);
      }
    } catch (emailErr) {
      logger.error('❌ Failed to send status update alert to admin:', emailErr.message);
    }

    // Send push notification to the citizen (if they have push enabled)
    try {
      if (report.user) {
        await pushService.sendPushToUser(
          report.user._id,
          '📋 Report Status Updated',
          `Your report "${report.title}" status has been updated to "${status}" by your assigned agency.`,
          '/citizen-dashboard/my-reports'
        );
        logger.info(`✅ Status update push notification sent to citizen: ${report.user.fullName}`);
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send status update push notification to citizen:', pushErr.message);
    }

    // Send push notification to admin
    try {
      if (report.user) {
        const agencyOrg = await Organization.findById(orgId).select('name');
        await pushService.sendPushToAdmins(
          '📋 Report Status Updated',
          `Report "${report.title}" (${report.category}) updated to "${status}" by ${agencyOrg ? agencyOrg.name : 'Agency'}. Citizen: ${report.user.fullName}.`,
          '/admin/reports'
        );
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send status update push notification to admin:', pushErr.message);
    }

    return res.status(200).json(report);
  } catch (error) {
    logger.error('Agency update report status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
