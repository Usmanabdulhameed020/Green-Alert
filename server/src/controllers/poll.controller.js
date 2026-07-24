const logger = require('../utils/logger');
const Poll = require('../models/Poll');
const Community = require('../models/Community');

exports.create = async (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Poll question is required' });
    }
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 options are required' });
    }
    if (options.length > 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 options allowed' });
    }

    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a member to create a poll' });
    }

    const poll = await Poll.create({
      question: question.trim(),
      options: options.map(o => ({ text: o.text || o })),
      createdBy: req.user._id,
      community: req.params.communityId,
    });

    const populated = await Poll.findById(poll._id)
      .populate('createdBy', 'fullName email avatar');

    return res.status(201).json(populated);
  } catch (error) {
    logger.error('Create poll error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getByCommunity = async (req, res) => {
  try {
    const polls = await Poll.find({ community: req.params.communityId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName email avatar');

    return res.status(200).json(polls);
  } catch (error) {
    logger.error('Get polls error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.vote = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option index' });
    }

    const community = await Community.findById(poll.community);
    const isMember = community.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a member to vote' });
    }

    const alreadyVoted = poll.options.some(o =>
      o.voters.some(v => v.toString() === req.user._id.toString())
    );
    if (alreadyVoted) {
      return res.status(400).json({ success: false, message: 'You have already voted on this poll' });
    }

    if (poll.expiresAt && new Date() > poll.expiresAt) {
      return res.status(400).json({ success: false, message: 'This poll has expired' });
    }

    poll.options[optionIndex].voters.push(req.user._id);
    await poll.save();

    const populated = await Poll.findById(poll._id)
      .populate('createdBy', 'fullName email avatar');

    return res.status(200).json(populated);
  } catch (error) {
    logger.error('Vote poll error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    if (poll.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the creator can delete this poll' });
    }

    await poll.deleteOne();
    return res.status(200).json({ success: true, message: 'Poll deleted' });
  } catch (error) {
    logger.error('Delete poll error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
