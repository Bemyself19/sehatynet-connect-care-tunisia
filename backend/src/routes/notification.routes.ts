import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  clearAllNotifications
} from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Get notifications for authenticated user
router.get('/', getNotifications);
router.get('/unread', getUnreadNotifications);
router.get('/stats', getNotificationStats);

// Mark notifications as read
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Create notification (admin only)
router.post('/', createNotification);

// Debug endpoint to clear all notifications
router.delete('/clear-all', authenticateJWT, clearAllNotifications);

export default router;
