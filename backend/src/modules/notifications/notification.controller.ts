import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service.js';
import { success } from '@/utils/response.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { notificationQuerySchema, markReadSchema } from './notification.schemas.js';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const filters = notificationQuerySchema.parse(req.query);

  const result = await NotificationService.list(tenantId, userId, filters);
  return success(res, result, 'Notifications fetched');
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;

  const count = await NotificationService.getUnreadCount(tenantId, userId);
  return success(res, { count }, 'Unread count fetched');
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const { ids } = markReadSchema.parse(req.body);

  const result = await NotificationService.markAsRead(tenantId, userId, ids);
  return success(res, { count: result.count }, 'Notifications marked as read');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;

  const result = await NotificationService.markAllAsRead(tenantId, userId);
  return success(res, { count: result.count }, 'All notifications marked as read');
});

export const archiveNotification = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const id = req.params.id as string;

  await NotificationService.archive(tenantId, userId, id);
  return success(res, null, 'Notification archived');
});
