import type { Request, Response } from 'express';
import { ActivityService } from './activity.service.ts';
import { success } from '@/utils/response.ts';

export class ActivityController {
  static async list(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await ActivityService.listActivities(req.user!.tenantId, limit);
    return success(res, activities);
  }
}
