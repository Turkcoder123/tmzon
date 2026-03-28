const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
} = require('../controllers/messageController');

router.post('/conversations', auth, createConversation);
router.get('/conversations', auth, getConversations);
router.get('/conversations/:id/messages', auth, getMessages);
router.post('/conversations/:id/messages', auth, sendMessage);

module.exports = router;
