import { z } from 'zod';

export const createDealSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    value: z.number().optional(),
    currency: z.string().optional(),
    probability: z.number().min(0).max(100).optional(),
    status: z.enum(['open', 'won', 'lost']).optional(),
    expectedCloseAt: z.string().datetime().optional(),
    stageId: z.string().cuid('Valid stage ID is required'),
    contactId: z.string().cuid().optional(),
    companyId: z.string().cuid().optional(),
    assignedToId: z.string().cuid().optional(),
    sourceLeadId: z.string().cuid().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateDealSchema = createDealSchema.partial();

export const addProductToDealSchema = z.object({
  body: z.object({
    productId: z.string().cuid('Product ID is required'),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    notes: z.string().optional(),
  }),
});

export const dealFilterSchema = z.object({
  query: z.object({
    stageId: z.string().optional(),
    status: z.string().optional(),
    assignedToId: z.string().optional(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    minValue: z.string().optional().transform(Number),
    maxValue: z.string().optional().transform(Number),
    expectedCloseAtFrom: z.string().optional(),
    expectedCloseAtTo: z.string().optional(),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
