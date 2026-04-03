const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', auth, messageController.getConversations);
router.post('/conversations', auth, messageController.createConversation);
router.get('/conversations/:id/messages', auth, messageController.getMessages);
router.post('/conversations/:id/messages', auth, messageController.sendMessage);
router.post('/conversations/:id/read', auth, messageController.markAsRead);

module.exports = router;
