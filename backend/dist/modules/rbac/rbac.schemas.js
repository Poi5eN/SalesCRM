import { z } from 'zod';
export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Role name must be at least 2 characters'),
        description: z.string().optional(),
    }),
});
export const updateRolePermissionsSchema = z.object({
    body: z.object({
        permissionIds: z.array(z.string().cuid('Invalid permission ID')),
    }),
});
