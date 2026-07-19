import { z } from 'zod';

export const notificationQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
});

export const markReadSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one notification ID required'),
});

export const notificationSettingsSchema = z.object({
  emailDigest: z.enum(['none', 'daily', 'weekly']).optional(),
  notifySlaBreach: z.boolean().optional(),
  notifyTaskDue: z.boolean().optional(),
  notifyDealWon: z.boolean().optional(),
  notifyMentions: z.boolean().optional(),
});
