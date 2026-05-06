import apiClient from './client.ts';
import type { ApiResponse, Tenant, User, Role } from '@/types/api.types.ts';

export const getMyTenant = (): Promise<ApiResponse<Tenant>> =>
  apiClient.get('/tenants/me').then(r => r.data);

export const updateMyTenant = (data: any): Promise<ApiResponse<Tenant>> =>
  apiClient.patch('/tenants/me', data).then(r => r.data);

export const getTenantUsers = (params?: any): Promise<ApiResponse<User[]>> =>
  apiClient.get('/tenants/me/users', { params }).then(r => r.data);

export const updateTenantUser = (id: string, data: any): Promise<ApiResponse<User>> =>
  apiClient.patch(`/tenants/users/${id}`, data).then(r => r.data);

export const deleteTenantUser = (id: string, reassignToId: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/tenants/users/${id}`, { data: { reassignToId } }).then(r => r.data);

// Roles
export const getRoles = (): Promise<ApiResponse<Role[]>> =>
  apiClient.get('/rbac/roles').then(r => r.data);

export const createRole = (data: any): Promise<ApiResponse<Role>> =>
  apiClient.post('/rbac/roles', data).then(r => r.data);

export const getRole = (id: string): Promise<ApiResponse<Role>> =>
  apiClient.get(`/rbac/roles/${id}`).then(r => r.data);

export const updateRolePermissions = (id: string, permissionIds: string[]): Promise<ApiResponse<void>> =>
  apiClient.put(`/rbac/roles/${id}/permissions`, { permissionIds }).then(r => r.data);
