import apiClient from './client.ts';
import type { ApiResponse, PaginatedResponse, Product } from '@/types/api.types.ts';

export const getProducts = (params?: any): Promise<ApiResponse<PaginatedResponse<Product>>> =>
  apiClient.get('/products', { params }).then(r => r.data);

export const getProduct = (id: string): Promise<ApiResponse<Product>> =>
  apiClient.get(`/products/${id}`).then(r => r.data);

export const createProduct = (data: any): Promise<ApiResponse<Product>> =>
  apiClient.post('/products', data).then(r => r.data);

export const updateProduct = (id: string, data: any): Promise<ApiResponse<Product>> =>
  apiClient.patch(`/products/${id}`, data).then(r => r.data);

export const deleteProduct = (id: string): Promise<ApiResponse<void>> =>
  apiClient.delete(`/products/${id}`).then(r => r.data);
