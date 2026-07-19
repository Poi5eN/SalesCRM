import apiClient from './client.ts';

export const addComment = (data: { entityType: string; entityId: string; body: string; mentions?: string[] }) =>
  apiClient.post('/comments', data);

export const getComments = (entityType: string, entityId: string) =>
  apiClient.get(`/comments/${entityType}/${entityId}`);
