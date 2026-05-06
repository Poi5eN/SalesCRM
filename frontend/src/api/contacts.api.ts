import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Contact } from '@/types/api.types.ts';

export const getContacts = (params?: any): Promise<ApiResponse<PaginatedResponse<Contact>>> =>
  apiClient.get('/contacts', { params }).then(r => r.data);

export const getContact = (id: string): Promise<ApiResponse<Contact>> =>
  apiClient.get(`/contacts/${id}`).then(r => r.data);

export const createContact = (data: any): Promise<ApiResponse<Contact>> =>
  apiClient.post('/contacts', data).then(r => r.data);

export const updateContact = (id: string, data: any): Promise<ApiResponse<Contact>> =>
  apiClient.patch(`/contacts/${id}`, data).then(r => r.data);

export const deleteContact = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/contacts/${id}`).then(r => r.data);

export const mergeContacts = (targetId: string, sourceId: string): Promise<ApiResponse<Contact>> =>
  apiClient.post(`/contacts/${targetId}/merge`, { sourceId }).then(r => r.data);

export const getContactTimeline = (id: string): Promise<ApiResponse<any>> =>
  apiClient.get(`/contacts/${id}/timeline`).then(r => r.data);

export const checkDuplicate = (params: { email?: string; phone?: string }): Promise<ApiResponse<any>> =>
  apiClient.get('/contacts/check-duplicate', { params }).then(r => r.data);
