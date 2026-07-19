import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
} from './notification.controller.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', archiveNotification);

export default router;
