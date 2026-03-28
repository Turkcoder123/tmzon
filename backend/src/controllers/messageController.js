const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// POST /api/messages/conversations
exports.createConversation = async (req, res, next) => {
  try {
    const { type, participants, groupName } = req.body;

    if (!type || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Tür ve katılımcılar gerekli' });
    }

    const allParticipants = [...new Set([req.userId.toString(), ...participants])];

    if (type === 'direct') {
      if (allParticipants.length !== 2) {
        return res.status(400).json({ error: 'Direkt mesaj için tam 2 katılımcı gerekli' });
      }

      const existing = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: 2 },
        isActive: true,
      }).populate('participants', 'username displayName avatar');

      if (existing) {
        return res.json({ conversation: existing });
      }
    }

    if (type === 'group') {
      if (allParticipants.length < 3) {
        return res.status(400).json({ error: 'Grup için en az 3 katılımcı gerekli' });
      }
      if (!groupName) {
        return res.status(400).json({ error: 'Grup adı gerekli' });
      }
    }

    const conversation = await Conversation.create({
      type,
      participants: allParticipants,
      groupName: type === 'group' ? groupName : undefined,
      admin: type === 'group' ? req.userId : undefined,
    });

    await conversation.populate('participants', 'username displayName avatar');
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .populate('participants', 'username displayName avatar')
      .populate('lastMessage');

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/conversations/:id/messages
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Yetkisiz' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: req.params.id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username displayName avatar');

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

// POST /api/messages/conversations/:id/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Mesaj içeriği gerekli' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Yetkisiz' });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.userId,
      content,
      readBy: [req.userId],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate('sender', 'username displayName avatar');
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};
