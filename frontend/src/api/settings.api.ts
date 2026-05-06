import apiClient from './client.ts';
import type { ApiResponse, Tenant, User, Role, Permission } from '@/types/api.types.ts';

// ─── Tenant ───────────────────────────────────────────────────────────────────
export const getTenant = (): Promise<ApiResponse<Tenant>> =>
  apiClient.get('/tenants/me').then(r => r.data);

export const updateTenant = (data: any): Promise<ApiResponse<Tenant>> =>
  apiClient.patch('/tenants/me', data).then(r => r.data);

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = (): Promise<ApiResponse<User[]>> =>
  apiClient.get('/tenants/me/users').then(r => r.data);

export const updateUser = (id: string, data: any): Promise<ApiResponse<User>> =>
  apiClient.patch(`/tenants/users/${id}`, data).then(r => r.data);

export const deleteUser = (id: string, data: any): Promise<ApiResponse<void>> =>
  apiClient.delete(`/tenants/users/${id}`, { data }).then(r => r.data);

export const inviteUser = (data: any): Promise<ApiResponse<{ inviteLink: string }>> =>
  apiClient.post('/auth/invite', data).then(r => r.data);

// ─── RBAC ─────────────────────────────────────────────────────────────────────
export const getRoles = (): Promise<ApiResponse<Role[]>> =>
  apiClient.get('/rbac/roles').then(r => r.data);

export const getRole = (id: string): Promise<ApiResponse<Role>> =>
  apiClient.get(`/rbac/roles/${id}`).then(r => r.data);

export const createRole = (data: { name: string; description?: string }): Promise<ApiResponse<Role>> =>
  apiClient.post('/rbac/roles', data).then(r => r.data);

export const deleteRole = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/rbac/roles/${id}`).then(r => r.data);

export const updateRolePermissions = (id: string, permissions: { resource: string; action: string }[]): Promise<ApiResponse<void>> =>
  apiClient.put(`/rbac/roles/${id}/permissions`, { permissions }).then(r => r.data);

export const getAllPermissions = (): Promise<ApiResponse<Permission[]>> =>
  apiClient.get('/rbac/permissions').then(r => r.data);
