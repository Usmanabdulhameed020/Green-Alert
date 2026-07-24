const logger = require('../utils/logger');
const Report = require('../models/Report');
const User = require('../models/User');
const pushService = require('../services/push.service');
const { emitReportComment, emitReportReply } = require('../services/socket.service');

/**
 * GET /api/v1/reports/:id/comments
 * Returns all comments (with populated user + nested replies) for a report.
 */
exports.getComments = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .select('comments')
      .populate('comments.user', 'fullName role avatar')
      .populate('comments.replies.user', 'fullName role avatar');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.status(200).json(report.comments);
  } catch (err) {
    logger.error('Get comments error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v1/reports/:id/comments
 * Add a top-level comment to a report (any authenticated user).
 */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    if (text && text.length > 2000) {
      return res.status(400).json({ success: false, message: 'Comment must be 2000 characters or less' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot comment on a closed report' });
    }

    const comment = { user: req.user._id, text: text.trim(), replies: [] };
    report.comments.push(comment);
    await report.save();

    // Re-fetch to get populated comment
    const updated = await Report.findById(report._id)
      .select('comments')
      .populate('comments.user', 'fullName role avatar')
      .populate('comments.replies.user', 'fullName role avatar');

    const newComment = updated.comments[updated.comments.length - 1];

    // Emit real-time event to everyone viewing this report
    emitReportComment(report._id.toString(), newComment);

    // Send push notification to the report owner (if someone else commented)
    try {
      if (report.user && report.user.toString() !== req.user._id.toString()) {
        await pushService.sendPushToUser(
          report.user,
          '💬 New Comment on Your Report',
          `${req.user.fullName || 'Someone'} commented on "${report.title}": "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
          `/citizen-dashboard/reports/${report._id}`
        );
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send comment push:', pushErr.message);
    }

    return res.status(201).json(newComment);
  } catch (err) {
    logger.error('Add comment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/v1/reports/:id/comments/:commentId/replies
 * Add a reply to an existing comment (any authenticated user).
 */
exports.addReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot reply on a closed report' });
    }

    const comment = report.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const reply = { user: req.user._id, text: text.trim() };
    comment.replies.push(reply);
    await report.save();

    // Re-fetch for populated data
    const updated = await Report.findById(report._id)
      .select('comments')
      .populate('comments.user', 'fullName role avatar')
      .populate('comments.replies.user', 'fullName role avatar');

    const updatedComment = updated.comments.id(req.params.commentId);
    const newReply = updatedComment.replies[updatedComment.replies.length - 1];

    // Emit real-time event
    emitReportReply(report._id.toString(), req.params.commentId, newReply);

    // Send push notification to the comment author (if someone else replied)
    try {
      const commentAuthorId = updatedComment.user;
      if (commentAuthorId && commentAuthorId.toString() !== req.user._id.toString()) {
        const author = await User.findById(commentAuthorId).select('fullName').lean();
        await pushService.sendPushToUser(
          commentAuthorId,
          '💬 Reply to Your Comment',
          `${req.user.fullName || 'Someone'} replied to your comment on "${report.title}": "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
          `/citizen-dashboard/reports/${report._id}`
        );
      }
    } catch (pushErr) {
      logger.error('❌ Failed to send reply push:', pushErr.message);
    }

    return res.status(201).json(newReply);
  } catch (err) {
    logger.error('Add reply error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
