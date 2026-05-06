import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Lead } from '@/types/api.types.ts';

export const getLeads = (params?: any): Promise<ApiResponse<PaginatedResponse<Lead>>> =>
  apiClient.get('/leads', { params }).then(r => r.data);

export const getLeadBoard = (): Promise<ApiResponse<any>> =>
  apiClient.get('/leads/board').then(r => r.data);

export const getLead = (id: string): Promise<ApiResponse<Lead>> =>
  apiClient.get(`/leads/${id}`).then(r => r.data);

export const createLead = (data: any): Promise<ApiResponse<Lead>> =>
  apiClient.post('/leads', data).then(r => r.data);

export const updateLead = (id: string, data: any): Promise<ApiResponse<Lead>> =>
  apiClient.patch(`/leads/${id}`, data).then(r => r.data);

export const deleteLead = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/leads/${id}`).then(r => r.data);

export const convertLead = (id: string, data: any): Promise<ApiResponse<any>> =>
  apiClient.post(`/leads/${id}/convert`, data).then(r => r.data);

export const getLeadTimeline = (id: string): Promise<ApiResponse<any>> =>
  apiClient.get(`/leads/${id}/timeline`).then(r => r.data);

export const checkDuplicate = (params: { title: string; contactId?: string; companyId?: string }): Promise<ApiResponse<any>> =>
  apiClient.get('/leads/check-duplicate', { params }).then(r => r.data);
