import { z } from 'zod';

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    platform: z.string().min(1, 'Platform is required'),
    budget: z.number().min(0, 'Budget must be positive or zero'),
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    startDate: z.string().datetime().or(z.string().nullable()).optional(),
    endDate: z.string().datetime().or(z.string().nullable()).optional(),
  }),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const campaignFilterSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    platform: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional().transform(val => val ? Number(val) : undefined),
    limit: z.string().optional().transform(val => val ? Number(val) : undefined),
  }),
});
