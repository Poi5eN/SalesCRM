import apiClient from './client.ts';

export const getNotifications = (params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) =>
  apiClient.get('/notifications', { params });

export const getUnreadCount = () =>
  apiClient.get('/notifications/unread-count');

export const markAsRead = (ids: string[]) =>
  apiClient.patch('/notifications/mark-read', { ids });

export const markAllAsRead = () =>
  apiClient.patch('/notifications/mark-all-read');

export const archiveNotification = (id: string) =>
  apiClient.delete(`/notifications/${id}`);
