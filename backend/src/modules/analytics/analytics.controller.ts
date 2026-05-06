import type { Request, Response } from 'express';
import { success, error } from '@/utils/response.ts';
import * as analyticsService from './analytics.service.ts';

export const getSummary = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const period = (req.query.period as string) || '30d';

    const summary = await analyticsService.getAnalyticsSummary(tenantId, period);
    return success(res, summary, 'Analytics summary retrieved successfully');
  } catch (err: any) {
    console.error('Analytics Error:', err);
    return error(res, 'Failed to retrieve analytics summary', 500);
  }
};

export const getHeatmap = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const heatmap = await analyticsService.getActivityHeatmap(tenantId);
    return success(res, heatmap, 'Activity heatmap retrieved successfully');
  } catch (err: any) {
    return error(res, 'Failed to retrieve activity heatmap', 500);
  }
};
