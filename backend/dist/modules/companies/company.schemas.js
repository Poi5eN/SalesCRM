import { z } from 'zod';
export const createCompanySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Company name is required'),
        website: z.string().url().optional().or(z.literal('')),
        industry: z.string().optional(),
        size: z.string().optional(),
        country: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        pincode: z.string().optional(),
        linkedinUrl: z.string().url().optional().or(z.literal('')),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.string(), z.any()).optional(),
    }),
});
export const updateCompanySchema = createCompanySchema.partial();
export const companyFilterSchema = z.object({
    query: z.object({
        industry: z.string().optional(),
        size: z.string().optional(),
        country: z.string().optional(),
        tag: z.string().optional(),
        search: z.string().optional(),
        page: z.string().optional().transform(Number),
        limit: z.string().optional().transform(Number),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        includeDeleted: z.string().optional().transform(v => v === 'true'),
    }),
});
