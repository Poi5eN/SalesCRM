import type { Request, Response } from 'express';
import { LeadScoringService } from './leadScoring.service.ts';
import { success } from '@/utils/response.ts';
import { DEFAULT_RULES } from './leadScoring.types.ts';

export class LeadScoringController {
  static getRules = async (req: Request, res: Response) => {
    const rules = await LeadScoringService.getRules(req.user!.tenantId);
    return success(res, rules, 'Lead scoring rules fetched successfully');
  };

  static updateRules = async (req: Request, res: Response) => {
    const rules = req.body;
    await LeadScoringService.updateRules(req.user!.tenantId, rules);
    return success(res, rules, 'Lead scoring rules updated successfully');
  };

  static resetRules = async (req: Request, res: Response) => {
    await LeadScoringService.updateRules(req.user!.tenantId, DEFAULT_RULES);
    return success(res, DEFAULT_RULES, 'Lead scoring rules reset to defaults');
  };
}
