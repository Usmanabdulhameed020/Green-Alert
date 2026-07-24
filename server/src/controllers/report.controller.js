const logger = require('../utils/logger');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../services/email.service');
const pushService = require('../services/push.service');
const { emitReportStatusChanged, emitNewReport, emitNotification } = require('../services/socket.service');
const { awardXP } = require('../services/gamification.service');

/**
 * Get all reports across all users (for community explore)
 * GET /api/reports
 */
exports.getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'fullName email role avatar')
      .populate('assignedTo', 'name email category phone')
      .populate('aiDuplicateOf', 'title location');

    // Set pagination headers
    const total = await Report.countDocuments();
    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', Math.ceil(total / limit));

    return res.status(200).json(reports);
  } catch (error) {
    logger.error('Get all reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all reports created by the logged-in user
 * GET /api/reports/my-reports
 */
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email role')
      .populate('assignedTo', 'name email category phone');

    return res.status(200).json(reports);
  } catch (error) {
    logger.error('Get my reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get all reports assigned to the requesting agency's organization
 * GET /api/reports/agency-reports
 */
exports.getAgencyReports = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const reports = await Report.find({ assignedTo: organizationId })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email role avatar')
      .populate('assignedTo', 'name email category phone');

    return res.status(200).json(reports);
  } catch (error) {
    logger.error('Get agency reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get report by ID
 * GET /api/reports/:id
 */
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'fullName email role avatar')
      .populate('assignedTo', 'name email category phone')
      .populate('aiDuplicateOf', 'title location')
      .populate('comments.user', 'fullName email role avatar')
      .populate('comments.replies.user', 'fullName email role avatar');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json(report);
  } catch (error) {
    logger.error('Get report by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid Report ID format' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Create a new report (optional helper endpoint)
 * POST /api/reports
 */
exports.createReport = async (req, res) => {
  try {
    const { title, description, location, latitude, longitude, category, priority, imageUrl, images } = req.body;

    if (!title || !description || !location || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, description, location, and category' });
    }

    const report = await Report.create({
      title,
      description,
      location,
      latitude,
      longitude,
      category,
      priority,
      imageUrl: imageUrl || '',
      images: images || [],
      user: req.user._id
    });

    // Populate for socket event
    const populated = await Report.findById(report._id)
      .populate('user', 'fullName email')
      .populate('assignedTo', 'name email category');

    // Emit real-time event
    emitNewReport(populated);

    // Award XP for creating a report
    awardXP(req.user._id, 20).catch(err => logger.error('XP award error:', err));

    // Send confirmation email to citizen
    try {
      await emailService.sendReportSubmittedEmail(
        req.user.email,
        req.user.fullName,
        { title: report.title, category: report.category, priority: report.priority || 'Medium', location: report.location, description: report.description }
      );
    } catch (emailErr) {
      logger.error('❌ Failed to send report submitted email to citizen:', emailErr.message);
    }

    // Send alert email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await emailService.sendAdminNewReportAlert(
          adminEmail,
          { title: report.title, category: report.category, priority: report.priority || 'Medium', location: report.location, description: report.description },
          { fullName: req.user.fullName, email: req.user.email }
        );
      }
    } catch (emailErr) {
      logger.error('❌ Failed to send new report alert to admin:', emailErr.message);
    }

    // Send push notification to citizen (if they have push enabled)
    try {
      await pushService.sendPushToUser(
        req.user._id,
        'Report Submitted ✅',
        `Your report "${report.title}" (${report.category}) has been received and is under review.`,
        '/citizen-dashboard/my-reports'
      );
    } catch (pushErr) {
      logger.error('❌ Failed to send push notification to citizen:', pushErr.message);
    }

    // Send push notification to admin
    try {
      await pushService.sendPushToAdmins(
        '🚨 New Report Submitted',
        `"${report.title}" | ${report.category} | Priority: ${report.priority || 'Medium'} — by ${req.user.fullName}`,
        '/admin/reports'
      );
    } catch (pushErr) {
      logger.error('❌ Failed to send push notification to admin:', pushErr.message);
    }

    return res.status(201).json(report);
  } catch (error) {
    logger.error('Create report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a report (only by the owner)
 * DELETE /api/reports/:id
 */
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own reports' });
    }

    await report.deleteOne();

    return res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    logger.error('Delete report error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid Report ID format' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update report status (admin/agency endpoint)
 * PATCH /api/reports/:id/status
 */
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const report = await Report.findById(req.params.id).populate('user');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot change status of a closed report' });
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

    // Populate for socket event
    const populated = await Report.findById(report._id)
      .populate('user', 'fullName email')
      .populate('assignedTo', 'name email category');

    // Emit real-time event
    emitReportStatusChanged(populated);

    // Award 50 XP if report is resolved
    if (status === 'Resolved' && report.user) {
      awardXP(report.user._id, 50).catch(err => logger.error('XP award error:', err));
    }

    // 1. Create a system notification for the dashboard feed
    try {
      if (report.user) {
        const notif = await Notification.create({
          user: report.user._id,
          title: `Report Status Updated`,
          message: `Your report "${report.title}" status has been updated to "${status}".`,
          type: 'report_status',
          report: report._id
        });
        emitNotification(notif);
      }
    } catch (notifErr) {
      logger.error('❌ Failed to create system notification:', notifErr.message);
    }

    // 2. Send the Brevo email notification to the citizen
    try {
      if (report.user) {
        await emailService.sendReportStatusEmail(
          report.user.email,
          report.user.fullName,
          report.title,
          status,
          report.category
        );
      }
    } catch (emailErr) {
      logger.error('❌ Failed to send status update email via Brevo:', emailErr.message || emailErr);
    }

    // 3. Send push notification to the citizen
    try {
      if (report.user) {
        await pushService.sendPushToUser(
          report.user._id,
          '📋 Report Status Updated',
          `Your report "${report.title}" status has been updated to "${status}".`,
          '/citizen-dashboard/my-reports'
        );
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send status update push to citizen:', pushErr.message);
    }

    return res.status(200).json(report);
  } catch (error) {
    logger.error('Update report status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
