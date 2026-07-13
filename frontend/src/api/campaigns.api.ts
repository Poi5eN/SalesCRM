import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Campaign } from '@/types/api.types.ts';

export const getCampaigns = (params?: any): Promise<ApiResponse<PaginatedResponse<Campaign>>> =>
  apiClient.get('/campaigns', { params }).then(r => r.data);

export const getCampaign = (id: string): Promise<ApiResponse<Campaign>> =>
  apiClient.get(`/campaigns/${id}`).then(r => r.data);

export const createCampaign = (data: any): Promise<ApiResponse<Campaign>> =>
  apiClient.post('/campaigns', data).then(r => r.data);

export const updateCampaign = (id: string, data: any): Promise<ApiResponse<Campaign>> =>
  apiClient.patch(`/campaigns/${id}`, data).then(r => r.data);

export const deleteCampaign = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/campaigns/${id}`).then(r => r.data);
