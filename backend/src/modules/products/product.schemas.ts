import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    type: z.enum(['oneTime', 'recurring']).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    sku: z.string().optional(),
    price: z.number().min(0),
    currency: z.string().optional(),
    billingCycle: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    customFields: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
  }),
});
