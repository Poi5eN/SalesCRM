import { z } from 'zod';

export const createStageSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['lead', 'deal']),
    position: z.number().int().min(0),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
    description: z.string().optional(),
    isFinal: z.boolean().optional(),
  }),
});

export const updateStageSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    position: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

export const archiveStageSchema = z.object({
  body: z.object({
    transferToStageId: z.string().cuid().optional(),
  }),
});

export const migrateStageSchema = z.object({
  body: z.object({
    targetStageId: z.string().cuid('Target stage ID is required'),
    reason: z.string().optional(),
  }),
});

export const reorderStagesSchema = z.object({
  body: z.array(z.object({
    id: z.string().cuid(),
    position: z.number().int().min(0),
  })),
});
