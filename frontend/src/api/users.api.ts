import apiClient from './client.ts';
import type { ApiResponse, User } from '@/types/api.types.ts';

export const getUsers = (params?: any): Promise<any> =>
  apiClient.get('/tenants/me/users', { params: { limit: 100, ...params } }).then(r => r.data);

export const getUser = (id: string): Promise<ApiResponse<User>> =>
  apiClient.get(`/tenants/users/${id}`).then(r => r.data);

export const updateUser = (id: string, data: any): Promise<ApiResponse<User>> =>
  apiClient.patch(`/tenants/users/${id}`, data).then(r => r.data);

export const deleteUser = (id: string, reassignToId: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/tenants/users/${id}`, { data: { reassignToId } }).then(r => r.data);
