import apiClient from './client.ts';
import type { ApiResponse } from '@/types/api.types.ts';

export const getActivities = (limit = 10): Promise<ApiResponse<any[]>> =>
  apiClient.get('/activities', { params: { limit } }).then(r => r.data);
