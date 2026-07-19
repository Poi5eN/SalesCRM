import apiClient from './client.ts';

export const getPlans = () =>
  apiClient.get('/billing/plans');

export const getSubscription = () =>
  apiClient.get('/billing/subscription');

export const changePlan = (plan: string) =>
  apiClient.post('/billing/change-plan', { plan });

export const updateBillingEmail = (email: string) =>
  apiClient.patch('/billing/billing-email', { email });

export const getUsage = () =>
  apiClient.get('/billing/usage');
