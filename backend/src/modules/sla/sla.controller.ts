import type { Request, Response } from 'express';
import { SLAService } from './sla.service.js';
import { success } from '@/utils/response.js';

export class SLAController {
  static getConfig = async (req: Request, res: Response) => {
    const config = await SLAService.getConfig(req.user!.tenantId);
    return success(res, config, 'SLA config fetched');
  };

  static updateConfig = async (req: Request, res: Response) => {
    const config = await SLAService.updateConfig(req.user!.tenantId, req.body);
    return success(res, config, 'SLA config updated');
  };

  static runCheck = async (req: Request, res: Response) => {
    const result = await SLAService.checkAndReassign(req.user!.tenantId);
    return success(res, result, 'SLA check complete');
  };

  static getAtRisk = async (req: Request, res: Response) => {
    const count = await SLAService.getAtRiskCount(req.user!.tenantId);
    return success(res, { atRiskCount: count }, 'At-risk count fetched');
  };
}
