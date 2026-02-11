const Chat = require('../models/Chat');
const User = require('../models/User');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Don't allow sending message to self
    if (senderId === receiverId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const chatMessage = new Chat({
      sender: senderId,
      receiver: receiverId,
      message,
      messageType
    });

    await chatMessage.save();

    // Populate sender details for response
    await chatMessage.populate('sender', 'name email profilePicture');

    // Emit to receiver via socket if online
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('newMessage', {
        _id: chatMessage._id,
        sender: chatMessage.sender,
        receiver: receiverId,
        message: chatMessage.message,
        messageType: chatMessage.messageType,
        createdAt: chatMessage.createdAt
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      chat: chatMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get chat messages between two users
const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Get messages between current user and specified user
    const messages = await Chat.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email profilePicture')
    .populate('receiver', 'name email profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark messages as read where current user is receiver
    await Chat.updateMany(
      {
        receiver: currentUserId,
        sender: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    const total = await Chat.countDocuments({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all chat conversations for current user
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log('Getting conversations for user:', currentUserId);

    // First try: Get all messages and group them manually
    const messages = await Chat.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email profilePicture')
    .populate('receiver', 'name email profilePicture')
    .sort({ createdAt: -1 });

    console.log('Found messages:', messages.length);

    // Group messages by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === currentUserId ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          _id: otherUserId,
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        });
      }
      
      // Update unread count
      if (msg.receiver._id.toString() === currentUserId && !msg.isRead) {
        conversationMap.get(otherUserId).unreadCount++;
      }
      
      // Update last message (messages are sorted by createdAt desc)
      conversationMap.get(otherUserId).lastMessage = msg;
    });

    const conversations = Array.from(conversationMap.values());
    console.log('Conversations created:', conversations.length);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    await Chat.updateMany(
      {
        receiver: currentUserId,
        sender: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Chat.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Chat.findByIdAndDelete(messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getChatMessages,
  getConversations,
  markAsRead,
  deleteMessage
};
