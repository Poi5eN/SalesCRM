import { TenantService } from './tenant.service.js';
import { success } from '../../utils/response.js';
export class TenantController {
    static getMe = async (req, res) => {
        const tenant = await TenantService.getTenant(req.user.tenantId);
        return success(res, tenant, 'Tenant details fetched successfully');
    };
    static updateMe = async (req, res) => {
        const tenant = await TenantService.updateTenant(req.user.tenantId, req.body);
        return success(res, tenant, 'Tenant updated successfully');
    };
    static listUsers = async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await TenantService.listUsers(req.user.tenantId, page, limit);
        return success(res, result, 'Users fetched successfully');
    };
    static updateUser = async (req, res) => {
        const user = await TenantService.updateUser(req.user.tenantId, req.params.id, req.body);
        return success(res, user, 'User updated successfully');
    };
    static deleteUser = async (req, res) => {
        const { reassignToUserId } = req.body;
        const result = await TenantService.softDeleteUser(req.user.tenantId, req.params.id, reassignToUserId);
        return success(res, result, 'User deleted successfully');
    };
}
