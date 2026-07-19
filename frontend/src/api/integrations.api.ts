import apiClient from './client.ts';

export const getIntegrations = () =>
  apiClient.get('/integrations');

export const updateIntegrations = (data: any) =>
  apiClient.patch('/integrations', data);

export const verifyWhatsApp = (verificationToken: string) =>
  apiClient.post('/integrations/whatsapp/verify', { verificationToken });

export const connectCalendar = (code: string) =>
  apiClient.post('/integrations/calendar/connect', { code });

export const syncWhatsApp = (contactPhone: string) =>
  apiClient.post('/integrations/whatsapp/sync', { contactPhone });
