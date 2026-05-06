import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Task } from '@/types/api.types.ts';

export const getTasks = (params?: any): Promise<ApiResponse<PaginatedResponse<Task>>> =>
  apiClient.get('/tasks', { params }).then(r => r.data);

export const getUpcomingTasks = (): Promise<ApiResponse<any>> =>
  apiClient.get('/tasks/upcoming').then(r => r.data);

export const getOverdueTasks = (): Promise<ApiResponse<any>> =>
  apiClient.get('/tasks/overdue').then(r => r.data);

export const getTask = (id: string): Promise<ApiResponse<Task>> =>
  apiClient.get(`/tasks/${id}`).then(r => r.data);

export const createTask = (data: any): Promise<ApiResponse<Task>> =>
  apiClient.post('/tasks', data).then(r => r.data);

export const updateTask = (id: string, data: any): Promise<ApiResponse<Task>> =>
  apiClient.patch(`/tasks/${id}`, data).then(r => r.data);

export const deleteTask = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/tasks/${id}`).then(r => r.data);
