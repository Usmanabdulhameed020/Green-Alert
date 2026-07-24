const logger = require('../utils/logger');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Reply = require('../models/Reply');
const Notification = require('../models/Notification');
const pushService = require('../services/push.service');
const { emitNotification } = require('../services/socket.service');

exports.getById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('createdBy', 'fullName email avatar')
      .populate('members', 'fullName email avatar');

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    return res.status(200).json(community);
  } catch (error) {
    logger.error('Get community by ID error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description } = req.body;

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can edit this community' });
    }

    if (name !== undefined) community.name = name;
    if (description !== undefined) community.description = description;
    if (req.body.rules !== undefined) community.rules = req.body.rules;
    await community.save();

    const populated = await Community.findById(community._id)
      .populate('createdBy', 'fullName email avatar')
      .populate('members', 'fullName email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Update community error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Community name is required' });
    }

    const community = await Community.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [req.user._id],
    });

    const populated = await Community.findById(community._id)
      .populate('createdBy', 'fullName email avatar')
      .populate('members', 'fullName email avatar');

    return res.status(201).json(populated);
  } catch (error) {
    logger.error('Create community error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName email avatar')
      .populate('members', 'fullName email avatar');

    return res.status(200).json(communities);
  } catch (error) {
    logger.error('Get communities error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.join = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    community.members.push(req.user._id);
    await community.save();

    const populated = await Community.findById(community._id)
      .populate('createdBy', 'fullName email avatar')
      .populate('members', 'fullName email avatar');

    // Notify the community creator
    try {
      if (community.createdBy.toString() !== req.user._id.toString()) {
        const notif = await Notification.create({
          user: community.createdBy,
          title: 'New Member Joined',
          message: `${req.user.fullName} joined your community "${community.name}".`,
          type: 'community',
        });
        emitNotification(notif);
        pushService.sendPushToUser(
          community.createdBy,
          '👥 New Community Member',
          `${req.user.fullName} joined "${community.name}"`,
          `/citizen-dashboard/community/${community._id}`
        ).catch(() => {});
      }
    } catch (err) {
      logger.error('Failed to send join notification:', err.message);
    }

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Join community error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.leave = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.createdBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Creator cannot leave. Delete the community instead.' });
    }

    const idx = community.members.indexOf(req.user._id);
    if (idx === -1) {
      return res.status(400).json({ success: false, message: 'Not a member' });
    }

    community.members.splice(idx, 1);
    await community.save();

    const populated = await Community.findById(community._id)
      .populate('createdBy', 'fullName email avatar')
      .populate('members', 'fullName email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Leave community error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the creator can delete this community' });
    }

    const posts = await Post.find({ community: req.params.id }).select('_id');
    const postIds = posts.map(p => p._id);
    if (postIds.length > 0) await Reply.deleteMany({ post: { $in: postIds } });
    await Post.deleteMany({ community: req.params.id });
    await community.deleteOne();

    return res.status(200).json({ success: true, message: 'Community deleted' });
  } catch (error) {
    logger.error('Delete community error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
