import { z } from 'zod';
export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        type: z.enum(['followUp', 'call', 'meeting', 'email', 'task', 'proposal', 'other']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        dueAt: z.string().datetime().optional(),
        reminderAt: z.string().datetime().optional(),
        leadId: z.string().cuid().optional(),
        dealId: z.string().cuid().optional(),
        contactId: z.string().cuid().optional(),
        assignedToId: z.string().cuid().optional(),
    }).refine(data => data.leadId || data.dealId || data.contactId, {
        message: "Task must be linked to a Lead, Deal, or Contact"
    }),
});
export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(['pending', 'inProgress', 'completed', 'cancelled', 'overdue']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        dueAt: z.string().datetime().optional(),
        assignedToId: z.string().cuid().optional(),
    }),
});
export const taskFilterSchema = z.object({
    query: z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        priority: z.string().optional(),
        assignedToId: z.string().optional(),
        leadId: z.string().optional(),
        dealId: z.string().optional(),
        contactId: z.string().optional(),
        dueBefore: z.string().optional(),
        dueAfter: z.string().optional(),
        isOverdue: z.string().optional().transform(v => v === 'true'),
        page: z.string().optional().transform(Number),
        limit: z.string().optional().transform(Number),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});
