import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Communication } from '@/types/api.types.ts';

export const getCommunications = (params?: any): Promise<ApiResponse<PaginatedResponse<Communication>>> =>
  apiClient.get('/communications', { params }).then(r => r.data);

export const getCommunication = (id: string): Promise<ApiResponse<Communication>> =>
  apiClient.get(`/communications/${id}`).then(r => r.data);

export const createCommunication = (data: any): Promise<ApiResponse<Communication>> =>
  apiClient.post('/communications', data).then(r => r.data);

export const updateCommunication = (id: string, data: any): Promise<ApiResponse<Communication>> =>
  apiClient.patch(`/communications/${id}`, data).then(r => r.data);

export const deleteCommunication = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/communications/${id}`).then(r => r.data);
