import apiClient from './client.ts';
import type { ApiResponse } from '@/types/api.types.ts';

export interface StageSkipPolicy {
  mode: string;
  enabled: boolean;
}

export interface StageTransition {
  id: string;
  tenantId: string;
  entityId: string;
  entityType: 'lead' | 'deal';
  fromStageId: string | null;
  toStageId: string;
  fromStageName: string | null;
  toStageName: string;
  actorId: string;
  isSkipOverride: boolean;
  skippedStages: string[];
  actor: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export const getStageSkipPolicy = (): Promise<ApiResponse<StageSkipPolicy>> =>
  apiClient.get('/stage-transitions/policy').then(r => r.data);

export const updateStageSkipPolicy = (enabled: boolean, mode = 'global'): Promise<ApiResponse<StageSkipPolicy>> =>
  apiClient.patch('/stage-transitions/policy', { enabled, mode }).then(r => r.data);

export const getStageTransitions = (entityId: string): Promise<ApiResponse<StageTransition[]>> =>
  apiClient.get(`/stage-transitions/${entityId}`).then(r => r.data);

export const validateTransition = (data: {
  fromStageId: string;
  toStageId: string;
  entityType: 'lead' | 'deal';
}): Promise<ApiResponse<{ allowed: boolean; isSkipOverride: boolean; skippedStages: string[]; reason?: string; message?: string }>> =>
  apiClient.post('/stage-transitions/validate', data).then(r => r.data);
