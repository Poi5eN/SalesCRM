import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Company } from '@/types/api.types.ts';

export const getCompanies = (params?: any): Promise<ApiResponse<PaginatedResponse<Company>>> =>
  apiClient.get('/companies', { params }).then(r => r.data);

export const getCompany = (id: string): Promise<ApiResponse<Company>> =>
  apiClient.get(`/companies/${id}`).then(r => r.data);

export const createCompany = (data: any): Promise<ApiResponse<Company>> =>
  apiClient.post('/companies', data).then(r => r.data);

export const updateCompany = (id: string, data: any): Promise<ApiResponse<Company>> =>
  apiClient.patch(`/companies/${id}`, data).then(r => r.data);

export const deleteCompany = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/companies/${id}`).then(r => r.data);

export const getCompanyContacts = (id: string): Promise<ApiResponse<any>> =>
  apiClient.get(`/companies/${id}/contacts`).then(r => r.data);

export const getCompanyDeals = (id: string): Promise<ApiResponse<any>> =>
  apiClient.get(`/companies/${id}/deals`).then(r => r.data);
