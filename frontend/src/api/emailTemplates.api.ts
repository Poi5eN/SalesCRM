import apiClient from './client.ts';
import type { ApiResponse } from '@/types/api.types.ts';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive: boolean;
  usageCount: number;
  createdById: string;
  createdBy?: { firstName: string; lastName: string };
  createdAt: string;
}

export const getTemplates = (): Promise<ApiResponse<EmailTemplate[]>> =>
  apiClient.get('/email-templates').then(r => r.data);

export const getTemplate = (id: string): Promise<ApiResponse<EmailTemplate>> =>
  apiClient.get(`/email-templates/${id}`).then(r => r.data);

export const createTemplate = (data: any): Promise<ApiResponse<EmailTemplate>> =>
  apiClient.post('/email-templates', data).then(r => r.data);

export const updateTemplate = (id: string, data: any): Promise<ApiResponse<EmailTemplate>> =>
  apiClient.patch(`/email-templates/${id}`, data).then(r => r.data);

export const deleteTemplate = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/email-templates/${id}`).then(r => r.data);

export const previewTemplate = (id: string, context: { leadId?: string; contactId?: string; dealId?: string }): Promise<ApiResponse<{ subject: string; body: string }>> =>
  apiClient.post(`/email-templates/${id}/preview`, context).then(r => r.data);
