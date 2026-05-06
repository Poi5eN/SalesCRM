import apiClient from './client.ts';
import type { ApiResponse, PipelineStage } from '@/types/api.types.ts';

export const getStages = (params?: any): Promise<ApiResponse<PipelineStage[]>> =>
  apiClient.get('/pipeline-stages', { params }).then(r => r.data);

export const createStage = (data: any): Promise<ApiResponse<PipelineStage>> =>
  apiClient.post('/pipeline-stages', data).then(r => r.data);

export const updateStage = (id: string, data: any): Promise<ApiResponse<PipelineStage>> =>
  apiClient.patch(`/pipeline-stages/${id}`, data).then(r => r.data);

export const reorderStages = (data: { stages: { id: string, position: number }[] }): Promise<ApiResponse<void>> =>
  apiClient.patch('/pipeline-stages/reorder', data).then(r => r.data);

export const archiveStage = (id: string, targetStageId: string): Promise<ApiResponse<void>> =>
  apiClient.post(`/pipeline-stages/${id}/archive`, { targetStageId }).then(r => r.data);
