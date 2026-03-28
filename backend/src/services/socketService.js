const logger = require('../config/logger');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    socket.on('join', (userId) => {
      socket.join(userId);
      logger.debug('User joined room', { userId, socketId: socket.id });
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, senderId, content } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(senderId)) {
          socket.emit('error', { message: 'Yetkisiz' });
          return;
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: senderId,
          content,
          readBy: [senderId],
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populated = await message.populate('sender', 'username displayName avatar');

        io.to(`conv:${conversationId}`).emit('newMessage', populated);

        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== senderId) {
            io.to(participantId.toString()).emit('messageNotification', {
              conversationId,
              message: populated,
            });
          }
        });
      } catch (err) {
        logger.error('Socket sendMessage error', { error: err.message });
        socket.emit('error', { message: 'Mesaj gönderilemedi' });
      }
    });

    socket.on('typing', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conv:${conversationId}`).emit('userTyping', { userId, conversationId });
    });

    socket.on('stopTyping', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conv:${conversationId}`).emit('userStopTyping', { userId, conversationId });
    });

    socket.on('markRead', async (data) => {
      try {
        const { conversationId, userId } = data;
        await Message.updateMany(
          { conversation: conversationId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        io.to(`conv:${conversationId}`).emit('messagesRead', { conversationId, userId });
      } catch (err) {
        logger.error('Socket markRead error', { error: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { socketId: socket.id });
    });
  });
};

module.exports = setupSocket;
