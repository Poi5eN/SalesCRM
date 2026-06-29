import type { Request, Response } from 'express';
import { ActivityService } from './activity.service.js';
import { success } from '@/utils/response.js';

export class ActivityController {
  static async list(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await ActivityService.listActivities(req.user!.tenantId, limit);
    return success(res, activities);
  }
}
