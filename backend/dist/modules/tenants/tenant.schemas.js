import { z } from 'zod';
export const updateTenantSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
        logoUrl: z.string().url().optional().or(z.literal('')),
        settings: z.record(z.string(), z.any()).optional(),
    }),
});
export const updateUserStatusRoleSchema = z.object({
    body: z.object({
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        roleId: z.string().cuid().optional(),
    }),
});
export const deleteUserSchema = z.object({
    body: z.object({
        reassignToUserId: z.string().cuid('User ID to reassign records to is required'),
    }),
});
