import apiClient from './client.ts';
import type { ApiResponse, User, Tenant } from '@/types/api.types.ts';

export interface LoginResponse {
  user: User;
  accessToken: string;
  tenant: Tenant;
}

export const login = (credentials: any): Promise<ApiResponse<LoginResponse>> =>
  apiClient.post('/auth/login', credentials).then(r => r.data);

export const logout = (): Promise<ApiResponse<void>> =>
  apiClient.post('/auth/logout').then(r => r.data);

export const getMe = (): Promise<ApiResponse<User>> =>
  apiClient.get('/auth/me').then(r => r.data);

export const registerTenant = (data: any): Promise<ApiResponse<LoginResponse>> =>
  apiClient.post('/auth/register-tenant', data).then(r => r.data);

export const inviteUser = (data: any): Promise<ApiResponse<void>> =>
  apiClient.post('/auth/invite', data).then(r => r.data);

export const acceptInvite = (data: any): Promise<ApiResponse<void>> =>
  apiClient.post('/auth/accept-invite', data).then(r => r.data);
