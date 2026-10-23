const Report = require('../models/Report');
const Organization = require('../models/Organization');

// Simple counts for the agency dashboard cards
exports.getAgencyStats = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization linked to your account.' });
    }

    const reports = await Report.find({ assignedTo: orgId });

    const total = reports.length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const assigned = reports.filter((r) => r.status === 'Assigned').length;
    const closed = reports.filter((r) => r.status === 'Closed').length;
    const submitted = reports.filter((r) => r.status === 'Submitted').length;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = reports.filter((r) => new Date(r.createdAt) >= weekAgo).length;

    const recentReports = await Report.find({ assignedTo: orgId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'fullName email');

    // Group counts by category, priority and month for the dashboard charts
    const categoryCounts = {};
    const priorityCounts = {};
    const monthCounts = {};
    reports.forEach((r) => {
      if (r.category) categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      if (r.priority) priorityCounts[r.priority] = (priorityCounts[r.priority] || 0) + 1;
      const month = new Date(r.createdAt).toISOString().slice(0, 7);
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const reportsByMonth = Object.keys(monthCounts)
      .sort()
      .slice(-12)
      .map((month) => ({ month, count: monthCounts[month] }));

    return res.status(200).json({
      totalAssigned: total,
      inProgress,
      resolved,
      assigned,
      closed,
      submitted,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      newThisWeek,
      recentReports,
      reportsByCategory: categoryCounts,
      reportsByPriority: priorityCounts,
      reportsByMonth,
    });
  } catch (error) {
    console.error('Agency stats error:', error);
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
    console.error('Get org profile error:', error);
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
    console.error('Update org profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Agency updates the status of a report assigned to it
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
    if (Array.isArray(req.body.resolutionImages)) {
      report.resolutionImages = req.body.resolutionImages;
    }
    if (req.body.resolutionNotes) {
      report.resolutionNotes = req.body.resolutionNotes;
    }
    if (status === 'Resolved' || status === 'Closed') {
      report.resolvedAt = new Date();
    }
    await report.save();

    return res.status(200).json(report);
  } catch (error) {
    console.error('Agency update report status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
