import { z } from 'zod';
const proposalItemSchema = z.object({
    productId: z.string().cuid().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
    taxRate: z.number().min(0).max(100).default(0),
});
export const createProposalSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Proposal title is required'),
        dealId: z.string().cuid().optional(),
        contactId: z.string().cuid().optional(),
        validUntil: z.string().datetime().optional(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        currency: z.string().optional(),
        items: z.array(proposalItemSchema).min(1, 'At least one line item is required'),
    }),
});
export const updateProposalSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        validUntil: z.string().datetime().optional(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected']).optional(),
    }),
});
export const addProposalItemSchema = z.object({
    body: proposalItemSchema,
});
export const updateProposalItemSchema = z.object({
    body: z.object({
        quantity: z.number().int().min(1).optional(),
        unitPrice: z.number().min(0).optional(),
        discount: z.number().min(0).max(100).optional(),
    }),
});
export const proposalFilterSchema = z.object({
    query: z.object({
        status: z.string().optional(),
        dealId: z.string().optional(),
        contactId: z.string().optional(),
        createdById: z.string().optional(),
        page: z.string().optional().transform(Number),
        limit: z.string().optional().transform(Number),
    }),
});
export const respondProposalSchema = z.object({
    body: z.object({
        response: z.enum(['accepted', 'rejected']),
        comment: z.string().optional(),
    }),
});
