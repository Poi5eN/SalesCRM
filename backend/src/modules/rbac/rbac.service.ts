import prisma from '@/config/database.ts';
import { Prisma } from '@prisma/client';

export class RBACService {
  static async listRoles(tenantId: string) {
    return await prisma.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  static async createRole(tenantId: string, data: { name: string; description?: string }) {
    const existingRole = await prisma.role.findFirst({
      where: { tenantId, name: data.name },
    });

    if (existingRole) {
      throw { status: 400, message: 'Role already exists', code: 'ROLE_EXISTS' };
    }

    return await prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    });
  }

  static async getRole(tenantId: string, roleId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw { status: 404, message: 'Role not found', code: 'ROLE_NOT_FOUND' };
    }

    return role;
  }

  static async updateRolePermissions(tenantId: string, roleId: string, permissionIds: string[]) {
    const role = await this.getRole(tenantId, roleId);

    // Roles should only be updated if they belong to the tenant
    // We already checked this in getRole

    return await prisma.$transaction(async (tx) => {
      // Delete existing mappings
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new mappings
      await tx.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId,
          permissionId: pId,
        })),
      });

      return await tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });
    });
  }

  static async deleteRole(tenantId: string, roleId: string) {
    const role = await this.getRole(tenantId, roleId);

    if (role.isSystem) {
      throw { status: 403, message: 'System roles cannot be deleted', code: 'SYSTEM_ROLE_PROTECTED' };
    }

    const userCount = await prisma.userTenantRole.count({
      where: { roleId },
    });

    if (userCount > 0) {
      throw { status: 409, message: 'Cannot delete role assigned to users', code: 'ROLE_IN_USE' };
    }

    await prisma.role.delete({
      where: { id: roleId },
    });
  }

  static async listPermissions(tenantId: string) {
    const permissions = await prisma.permission.findMany({
      where: { tenantId },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource
    const grouped = permissions.reduce((acc: any, p) => {
      if (!acc[p.resource]) acc[p.resource] = [];
      acc[p.resource].push({ id: p.id, action: p.action, description: p.description });
      return acc;
    }, {});

    return Object.entries(grouped).map(([resource, actions]) => ({
      resource,
      actions,
    }));
  }

  static async seedDefaults(tenantId: string, tx: Prisma.TransactionClient) {
    const resources = ['leads', 'deals', 'contacts', 'companies', 'tasks', 'proposals', 'products', 'users', 'settings'];
    const actions = ['read', 'create', 'update', 'delete', 'export'];

    // 1. Create Permissions
    const permissionsData = [];
    for (const res of resources) {
      for (const act of actions) {
        permissionsData.push({ tenantId, resource: res, action: act });
      }
    }

    await tx.permission.createMany({ data: permissionsData });
    const allPermissions = await tx.permission.findMany({ where: { tenantId } });

    // 2. Create Roles
    const roles = [
      { name: 'admin', description: 'Full administrative access', isSystem: true },
      { name: 'salesManager', description: 'Manage sales team and operations', isSystem: true },
      { name: 'salesRep', description: 'Individual contributor', isSystem: true },
      { name: 'viewer', description: 'Read-only access', isSystem: true },
    ];

    const createdRoles = [];
    for (const r of roles) {
      const role = await tx.role.create({
        data: { tenantId, ...r }
      });
      createdRoles.push(role);
    }

    const adminRole = createdRoles.find(r => r.name === 'admin')!;
    const managerRole = createdRoles.find(r => r.name === 'salesManager')!;
    const repRole = createdRoles.find(r => r.name === 'salesRep')!;
    const viewerRole = createdRoles.find(r => r.name === 'viewer')!;

    // 3. Assign Permissions
    // Admin gets everything
    await tx.rolePermission.createMany({
      data: allPermissions.map(p => ({ roleId: adminRole.id, permissionId: p.id }))
    });

    // Manager gets most things
    const managerPerms = allPermissions.filter(p => p.resource !== 'settings' || p.action === 'read');
    await tx.rolePermission.createMany({
      data: managerPerms.map(p => ({ roleId: managerRole.id, permissionId: p.id }))
    });

    // Rep gets read/create/update on business records
    const repPerms = allPermissions.filter(p => 
      ['leads', 'deals', 'contacts', 'companies', 'tasks', 'proposals'].includes(p.resource) && 
      ['read', 'create', 'update'].includes(p.action)
    );
    await tx.rolePermission.createMany({
      data: repPerms.map(p => ({ roleId: repRole.id, permissionId: p.id }))
    });

    // Viewer gets only read
    const viewerPerms = allPermissions.filter(p => p.action === 'read');
    await tx.rolePermission.createMany({
      data: viewerPerms.map(p => ({ roleId: viewerRole.id, permissionId: p.id }))
    });

    return { adminRole };
  }
}
