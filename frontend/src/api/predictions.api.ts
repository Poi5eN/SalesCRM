import apiClient from './client.ts';

export const getPredictions = () =>
  apiClient.get('/predictions/pipeline');

export const predictDeal = (id: string) =>
  apiClient.get(`/predictions/deal/${id}`);

export const getNextActions = () =>
  apiClient.get('/predictions/actions');
