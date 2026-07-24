const logger = require('../utils/logger');
const Post = require('../models/Post');
const Reply = require('../models/Reply');
const Community = require('../models/Community');
const Notification = require('../models/Notification');
const pushService = require('../services/push.service');
const { emitNotification } = require('../services/socket.service');

exports.getByCommunity = async (req, res) => {
  try {
    const filter = { community: req.params.communityId };
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'fullName email avatar');

    return res.status(200).json(posts);
  } catch (error) {
    logger.error('Get posts error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a member to post' });
    }

    const tags = Array.isArray(req.body.tags) ? req.body.tags.filter(t => ['Alert', 'Cleanup', 'Discussion', 'Event', 'Question'].includes(t)) : [];

    const post = await Post.create({
      content: content.trim(),
      author: req.user._id,
      community: req.params.communityId,
      tags,
    });

    const populated = await Post.findById(post._id)
      .populate('author', 'fullName email avatar');

    // Notify all other community members
    try {
      if (community) {
        const otherMembers = community.members.filter(m => m.toString() !== req.user._id.toString());
        for (const memberId of otherMembers) {
          const notif = await Notification.create({
            user: memberId,
            title: 'New Post in Community',
            message: `${req.user.fullName} posted in "${community.name}": "${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`,
            type: 'community',
          });
          emitNotification(notif);
        }
        // Push notification to all other members
        for (const memberId of otherMembers) {
          pushService.sendPushToUser(
            memberId,
            '💬 New Community Post',
            `${req.user.fullName} posted in "${community.name}": "${content.trim().substring(0, 60)}..."`,
            `/citizen-dashboard/community/${req.params.communityId}`
          ).catch(() => {});
        }
      }
    } catch (err) {
      logger.error('Failed to send community post notifications:', err.message);
    }

    return res.status(201).json(populated);
  } catch (error) {
    logger.error('Create post error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.toggleReact = async (req, res) => {
  try {
    const { type } = req.body;
    if (!['like', 'heart', 'fire'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction type' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingIdx = post.reactions.findIndex(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingIdx > -1) {
      if (post.reactions[existingIdx].type === type) {
        post.reactions.splice(existingIdx, 1);
      } else {
        post.reactions[existingIdx].type = type;
      }
    } else {
      post.reactions.push({ user: req.user._id, type });
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'fullName email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Toggle reaction error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' });
    }

    post.content = content.trim();
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('author', 'fullName email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Update post error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    await Reply.deleteMany({ post: post._id });
    await post.deleteOne();

    return res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    logger.error('Delete post error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
