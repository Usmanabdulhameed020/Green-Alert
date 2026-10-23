const Report = require('../models/Report');

// Get all reports across all users (for the Explore page)
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
      .populate('assignedTo', 'name email category phone');

    const total = await Report.countDocuments();
    res.set('X-Total-Count', total);
    res.set('X-Total-Pages', Math.ceil(total / limit));

    return res.status(200).json(reports);
  } catch (error) {
    console.error('Get all reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all reports created by the logged-in user
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email role')
      .populate('assignedTo', 'name email category phone');

    return res.status(200).json(reports);
  } catch (error) {
    console.error('Get my reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all reports assigned to the requesting agency's organization
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
    console.error('Get agency reports error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get a single report by its id
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'fullName email role avatar')
      .populate('assignedTo', 'name email category phone');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json(report);
  } catch (error) {
    console.error('Get report by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid Report ID format' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create a new report
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
      user: req.user._id,
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete a report (only the owner may delete it)
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
    console.error('Delete report error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid Report ID format' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update a report's status (admin/agency only)
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

    // An agency may only update reports assigned to its own organization
    if (req.user.role === 'agency') {
      const orgId = req.user.organizationId;
      if (!orgId || !report.assignedTo || report.assignedTo.toString() !== orgId.toString()) {
        return res.status(403).json({ success: false, message: 'This report is not assigned to your agency' });
      }
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
    console.error('Update report status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
