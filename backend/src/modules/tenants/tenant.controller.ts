import type { Request, Response } from 'express';
import { TenantService } from './tenant.service.js';
import { success } from '@/utils/response.js';

export class TenantController {
  static getMe = async (req: Request, res: Response) => {
    const tenant = await TenantService.getTenant(req.user!.tenantId);
    return success(res, tenant, 'Tenant details fetched successfully');
  };

  static updateMe = async (req: Request, res: Response) => {
    const tenant = await TenantService.updateTenant(req.user!.tenantId, req.body);
    return success(res, tenant, 'Tenant updated successfully');
  };

  static listUsers = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await TenantService.listUsers(req.user!.tenantId, page, limit);
    return success(res, result, 'Users fetched successfully');
  };

  static updateUser = async (req: Request, res: Response) => {
    const user = await TenantService.updateUser(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, user, 'User updated successfully');
  };

  static deleteUser = async (req: Request, res: Response) => {
    const { reassignToUserId } = req.body;
    const result = await TenantService.softDeleteUser(req.user!.tenantId, req.params.id as string, reassignToUserId);
    return success(res, result, 'User deleted successfully');
  };
}
