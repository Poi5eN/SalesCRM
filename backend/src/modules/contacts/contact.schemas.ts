import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().optional(),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    companyId: z.string().cuid().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    customFields: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateContactSchema = createContactSchema.partial();

export const mergeContactsSchema = z.object({
  body: z.object({
    sourceId: z.string().cuid('Source contact ID is required'),
    targetId: z.string().cuid('Target contact ID is required'),
  }),
});

export const contactFilterSchema = z.object({
  query: z.object({
    companyId: z.string().optional(),
    tag: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    includeDeleted: z.string().optional().transform(v => v === 'true'),
  }),
});
