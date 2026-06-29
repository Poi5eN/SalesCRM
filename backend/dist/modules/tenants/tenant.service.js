import prisma from '../../config/database.js';
export class TenantService {
    static async getTenant(tenantId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant)
            throw { status: 404, message: 'Tenant not found' };
        return tenant;
    }
    static async updateTenant(tenantId, data) {
        return await prisma.tenant.update({
            where: { id: tenantId },
            data,
        });
    }
    static async listUsers(tenantId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: { tenantId, deletedAt: null },
                include: {
                    userRoles: {
                        include: { role: true },
                    },
                },
                skip,
                take: limit,
            }),
            prisma.user.count({ where: { tenantId, deletedAt: null } }),
        ]);
        return {
            data: users.map(u => {
                const { passwordHash, refreshToken, ...rest } = u;
                return rest;
            }),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async updateUser(tenantId, userId, data) {
        return await prisma.$transaction(async (tx) => {
            if (data.status) {
                await tx.user.update({
                    where: { id: userId, tenantId },
                    data: { status: data.status },
                });
            }
            if (data.roleId) {
                // Remove existing roles for this tenant
                await tx.userTenantRole.deleteMany({
                    where: { userId, tenantId },
                });
                // Add new role
                await tx.userTenantRole.create({
                    data: {
                        userId,
                        tenantId,
                        roleId: data.roleId,
                    },
                });
            }
            return await tx.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        include: { role: true },
                    },
                },
            });
        });
    }
    static async softDeleteUser(tenantId, userId, reassignToUserId) {
        if (userId === reassignToUserId) {
            throw { status: 400, message: 'Cannot reassign records to the same user being deleted' };
        }
        // Verify reassignment user exists in same tenant
        const reassignUser = await prisma.user.findFirst({
            where: { id: reassignToUserId, tenantId, deletedAt: null },
        });
        if (!reassignUser) {
            throw { status: 404, message: 'Reassignment target user not found' };
        }
        return await prisma.$transaction(async (tx) => {
            // 1. Reassign Leads
            await tx.lead.updateMany({
                where: { assignedToId: userId, tenantId },
                data: { assignedToId: reassignToUserId },
            });
            // 2. Reassign Deals
            await tx.deal.updateMany({
                where: { assignedToId: userId, tenantId },
                data: { assignedToId: reassignToUserId },
            });
            // 3. Reassign Tasks
            await tx.task.updateMany({
                where: { assignedToId: userId, tenantId },
                data: { assignedToId: reassignToUserId },
            });
            // 4. Soft Delete User
            await tx.user.update({
                where: { id: userId, tenantId },
                data: {
                    deletedAt: new Date(),
                    status: 'inactive',
                    refreshToken: null
                },
            });
            return { success: true, message: 'User soft-deleted and records reassigned' };
        });
    }
}
