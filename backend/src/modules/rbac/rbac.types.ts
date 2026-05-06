import type { Role, Permission } from '@prisma/client';

export interface RoleWithPermissions extends Role {
  permissions: {
    permission: Permission;
  }[];
}

export interface PermissionGrouped {
  resource: string;
  actions: {
    id: string;
    action: string;
    description: string | null;
  }[];
}
