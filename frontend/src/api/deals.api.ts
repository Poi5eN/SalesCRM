import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Deal } from '@/types/api.types.ts';

export const getDeals = (params?: any): Promise<ApiResponse<PaginatedResponse<Deal>>> =>
  apiClient.get('/deals', { params }).then(r => r.data);

export const getDealBoard = (): Promise<ApiResponse<any>> =>
  apiClient.get('/deals/board').then(r => r.data);

export const getForecast = (): Promise<ApiResponse<any>> =>
  apiClient.get('/deals/forecast').then(r => r.data);

export const getDeal = (id: string): Promise<ApiResponse<Deal>> =>
  apiClient.get(`/deals/${id}`).then(r => r.data);

export const createDeal = (data: any): Promise<ApiResponse<Deal>> =>
  apiClient.post('/deals', data).then(r => r.data);

export const updateDeal = (id: string, data: any): Promise<ApiResponse<Deal>> =>
  apiClient.patch(`/deals/${id}`, data).then(r => r.data);

export const deleteDeal = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/deals/${id}`).then(r => r.data);

export const addDealProduct = (id: string, data: any): Promise<ApiResponse<any>> =>
  apiClient.post(`/deals/${id}/products`, data).then(r => r.data);

export const removeDealProduct = (id: string, productId: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/deals/${id}/products/${productId}`).then(r => r.data);
