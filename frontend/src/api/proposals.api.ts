import apiClient, { publicApiClient } from './client.ts';
import type { ApiResponse, PaginatedResponse, Proposal } from '@/types/api.types.ts';

export const getProposals = (params?: any): Promise<ApiResponse<PaginatedResponse<Proposal>>> =>
  apiClient.get('/proposals', { params }).then(r => r.data);

export const getProposal = (id: string): Promise<ApiResponse<Proposal>> =>
  apiClient.get(`/proposals/${id}`).then(r => r.data);

export const createProposal = (data: any): Promise<ApiResponse<Proposal>> =>
  apiClient.post('/proposals', data).then(r => r.data);

export const updateProposal = (id: string, data: any): Promise<ApiResponse<Proposal>> =>
  apiClient.patch(`/proposals/${id}`, data).then(r => r.data);

export const addProposalItem = (id: string, data: any): Promise<ApiResponse<any>> =>
  apiClient.post(`/proposals/${id}/items`, data).then(r => r.data);

export const updateProposalItem = (id: string, itemId: string, data: any): Promise<ApiResponse<any>> =>
  apiClient.patch(`/proposals/${id}/items/${itemId}`, data).then(r => r.data);

export const removeProposalItem = (id: string, itemId: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/proposals/${id}/items/${itemId}`).then(r => r.data);

export const reviseProposal = (id: string): Promise<ApiResponse<Proposal>> =>
  apiClient.post(`/proposals/${id}/revise`).then(r => r.data);

export const sendProposal = (id: string): Promise<ApiResponse<any>> =>
  apiClient.post(`/proposals/${id}/send`).then(r => r.data);

// Public API
export const getPublicProposal = (token: string): Promise<ApiResponse<any>> =>
  publicApiClient.get(`/public/proposals/${token}`).then(r => r.data);

export const respondPublicProposal = (token: string, data: any): Promise<ApiResponse<void>> =>
  publicApiClient.post(`/public/proposals/${token}/respond`, data).then(r => r.data);
