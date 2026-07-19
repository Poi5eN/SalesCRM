import apiClient from './client.ts';

export const getAnalyticsSummary = (period: string = '30d', funnelMode?: string) =>
  apiClient.get(`/analytics/summary?period=${period}${funnelMode ? `&funnel=${funnelMode}` : ''}`);

export const getActivityHeatmap = () =>
  apiClient.get('/analytics/heatmap');
