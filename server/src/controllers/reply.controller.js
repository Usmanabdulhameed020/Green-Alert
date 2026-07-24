const logger = require('../utils/logger');
const Reply = require('../models/Reply');
const Post = require('../models/Post');
const Community = require('../models/Community');

exports.getByPost = async (req, res) => {
  try {
    const replies = await Reply.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .populate('author', 'fullName email avatar');

    return res.status(200).json(replies);
  } catch (error) {
    logger.error('Get replies error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const community = await Community.findById(post.community);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a member to reply' });
    }

    const reply = await Reply.create({
      content: content.trim(),
      author: req.user._id,
      post: req.params.postId,
    });

    const populated = await Reply.findById(reply._id)
      .populate('author', 'fullName email avatar');

    return res.status(201).json(populated);
  } catch (error) {
    logger.error('Create reply error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const reply = await Reply.findById(req.params.id);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own replies' });
    }

    reply.content = content.trim();
    await reply.save();

    const populated = await Reply.findById(reply._id)
      .populate('author', 'fullName email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Update reply error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    if (reply.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own replies' });
    }

    await reply.deleteOne();

    return res.status(200).json({ success: true, message: 'Reply deleted' });
  } catch (error) {
    logger.error('Delete reply error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
