import { z } from 'zod';
export const createCommunicationSchema = z.object({
    body: z.object({
        type: z.enum(['email', 'call', 'meeting', 'note', 'whatsapp', 'linkedin', 'other']),
        direction: z.enum(['inbound', 'outbound']).optional(),
        sourceType: z.enum(['human', 'system', 'ai']).optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        occurredAt: z.string().datetime().optional(),
        durationSeconds: z.number().int().optional(),
        outcome: z.string().optional(),
        attachments: z.array(z.object({
            name: z.string(),
            url: z.string().url(),
            size: z.number().optional()
        })).optional(),
        leadId: z.string().cuid().optional(),
        dealId: z.string().cuid().optional(),
        contactId: z.string().cuid().optional(),
    }),
});
export const updateCommunicationSchema = z.object({
    body: z.object({
        outcome: z.string().optional(),
        body: z.string().optional(),
        summary: z.string().optional(),
        attachments: z.any().optional(),
    }),
});
export const communicationFilterSchema = z.object({
    query: z.object({
        leadId: z.string().optional(),
        dealId: z.string().optional(),
        contactId: z.string().optional(),
        type: z.string().optional(),
        sourceType: z.string().optional(),
        page: z.string().optional().transform(Number),
        limit: z.string().optional().transform(Number),
    }),
});
