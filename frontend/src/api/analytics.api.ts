import apiClient from './client.ts';

export const getAnalyticsSummary = (period: string = '30d') =>
  apiClient.get(`/analytics/summary?period=${period}`);

export const getActivityHeatmap = () =>
  apiClient.get('/analytics/heatmap');
