import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.enum(['open', 'converted', 'lost']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    source: z.string().optional(),
    value: z.number().optional(),
    currency: z.string().optional(),
    contactId: z.string().cuid().optional(),
    companyId: z.string().cuid().optional(),
    stageId: z.string().cuid().optional(),
    assignedToId: z.string().cuid().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.string(), z.any()).optional(),
    expectedCloseAt: z.string().datetime().optional(),
    campaignId: z.string().cuid().or(z.string().nullable()).optional(),
  }),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  body: z.object({
    dealTitle: z.string().min(1, 'Deal title is required'),
    dealValue: z.number().min(0),
    dealStageId: z.string().cuid('Valid deal stage ID is required'),
    expectedCloseAt: z.string().datetime().optional(),
  }),
});

export const leadFilterSchema = z.object({
  query: z.object({
    stageId: z.string().optional(),
    assignedToId: z.string().optional(),
    campaignId: z.string().optional(),
    priority: z.string().optional(),
    source: z.string().optional(),
    isConverted: z.string().optional().transform(v => v === 'true'),
    tag: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
