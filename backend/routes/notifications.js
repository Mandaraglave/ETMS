const express = require('express');
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Routes
router.get('/', auth, notificationController.getNotifications);
router.get('/unread/count', auth, notificationController.getUnreadCount);
router.put('/:id/read', auth, notificationController.markAsRead);
router.put('/read/all', auth, notificationController.markAllAsRead);
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router;
