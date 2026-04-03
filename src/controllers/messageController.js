const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../logger');

// GET /api/messages/conversations – list conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username avatar');

    logger.debug('getConversations', { user: req.user.username, count: conversations.length });
    res.json(conversations);
  } catch (err) {
    logger.error('getConversations error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages/conversations – create or get existing conversation
exports.createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: 'Invalid participantId' });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId], $size: 2 },
    }).populate('participants', 'username avatar');

    if (conversation) {
      logger.debug('Existing conversation found', { conversationId: conversation._id });
      return res.json(conversation);
    }

    conversation = await Conversation.create({
      participants: [req.user.id, participantId],
    });
    await conversation.populate('participants', 'username avatar');

    logger.info('Conversation created', { conversationId: conversation._id, participants: [req.user.username, participant.username] });
    res.status(201).json(conversation);
  } catch (err) {
    logger.error('createConversation error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/conversations/:id/messages – get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar');

    logger.debug('getMessages', { conversationId: req.params.id, count: messages.length });
    res.json(messages);
  } catch (err) {
    logger.error('getMessages error', { message: err.message, conversationId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages/conversations/:id/messages – send a message
exports.sendMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'content is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      content: content.trim(),
      readBy: [req.user.id],
    });

    // Update last message in conversation
    conversation.lastMessage = {
      content: content.trim().substring(0, 100),
      sender: req.user.id,
      createdAt: new Date(),
    };
    await conversation.save();

    await message.populate('sender', 'username avatar');

    logger.info('Message sent', { conversationId: req.params.id, messageId: message._id, user: req.user.username });
    res.status(201).json(message);
  } catch (err) {
    logger.error('sendMessage error', { message: err.message, conversationId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/messages/conversations/:id/read – mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not a participant in this conversation' });
    }

    await Message.updateMany(
      {
        conversation: req.params.id,
        readBy: { $ne: req.user.id },
      },
      { $addToSet: { readBy: req.user.id } }
    );

    logger.debug('Messages marked as read', { conversationId: req.params.id, user: req.user.username });
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    logger.error('markAsRead error', { message: err.message, conversationId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};
