import { z } from 'zod';
export const registerTenantSchema = z.object({
    body: z.object({
        tenantName: z.string().min(2, 'Tenant name must be at least 2 characters'),
        tenantSlug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
        adminEmail: z.string().email('Invalid email address'),
        adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
        adminFirstName: z.string().min(1, 'First name is required'),
        adminLastName: z.string().min(1, 'Last name is required'),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});
export const inviteUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        role: z.enum(['admin', 'salesManager', 'salesRep', 'viewer']),
    }),
});
export const acceptInviteSchema = z.object({
    body: z.object({
        inviteToken: z.string().uuid('Invalid invite token'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
    }),
});
