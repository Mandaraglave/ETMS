const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendMessage,
  getChatMessages,
  getConversations,
  markAsRead,
  deleteMessage
} = require('../controllers/chatController');

// Send a message
router.post('/send', auth, sendMessage);

// Get chat messages with a specific user
router.get('/messages/:userId', auth, getChatMessages);

// Get all conversations for current user
router.get('/conversations', auth, getConversations);

// Mark messages as read
router.put('/read/:userId', auth, markAsRead);

// Delete a message
router.delete('/:messageId', auth, deleteMessage);

module.exports = router;
