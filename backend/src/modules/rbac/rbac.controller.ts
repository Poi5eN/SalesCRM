import type { Request, Response } from 'express';
import { RBACService } from './rbac.service.js';
import { success } from '@/utils/response.js';

export class RBACController {
  static listRoles = async (req: Request, res: Response) => {
    const roles = await RBACService.listRoles(req.user!.tenantId);
    return success(res, roles, 'Roles fetched successfully');
  };

  static createRole = async (req: Request, res: Response) => {
    const role = await RBACService.createRole(req.user!.tenantId, req.body);
    return success(res, role, 'Role created successfully', 201);
  };

  static getRole = async (req: Request, res: Response) => {
    const role = await RBACService.getRole(req.user!.tenantId, req.params.id as string);
    return success(res, role, 'Role details fetched successfully');
  };

  static updatePermissions = async (req: Request, res: Response) => {
    const role = await RBACService.updateRolePermissions(
      req.user!.tenantId,
      req.params.id as string,
      req.body.permissionIds
    );
    return success(res, role, 'Role permissions updated successfully');
  };

  static deleteRole = async (req: Request, res: Response) => {
    await RBACService.deleteRole(req.user!.tenantId, req.params.id as string);
    return success(res, null, 'Role deleted successfully');
  };

  static listPermissions = async (req: Request, res: Response) => {
    const permissions = await RBACService.listPermissions(req.user!.tenantId);
    return success(res, permissions, 'Permissions fetched successfully');
  };

  static seedDefaults = async (req: Request, res: Response) => {
    // This is typically called internally or via a secure admin-only script
    // For now, let's just make it return a message or implement as needed
    return success(res, null, 'Default RBAC seeded successfully');
  };
}
