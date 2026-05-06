import { UserRole } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  status: string;
  avatarUrl?: string | null;
  lastLoginAt?: Date | null;
  permissions?: string[];
}

export interface LoginResponse {
  user: UserResponse;
  tokens: AuthTokens;
}
