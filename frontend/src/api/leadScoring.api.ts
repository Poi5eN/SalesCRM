import apiClient from './client.ts';
import type { ApiResponse } from '@/types/api.types.ts';

export interface ScoringRule {
  id: string;
  label: string;
  points: number;
  condition: string;
  isActive: boolean;
}

export const getRules = (): Promise<ApiResponse<ScoringRule[]>> =>
  apiClient.get('/lead-scoring/rules').then(r => r.data);

export const updateRules = (rules: ScoringRule[]): Promise<ApiResponse<ScoringRule[]>> =>
  apiClient.put('/lead-scoring/rules', rules).then(r => r.data);

export const resetRules = (): Promise<ApiResponse<ScoringRule[]>> =>
  apiClient.post('/lead-scoring/rules/reset').then(r => r.data);
