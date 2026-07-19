import type { Request, Response } from 'express';
import { StageTransitionService } from './stageTransition.service.js';
import { success } from '@/utils/response.js';

export class StageTransitionController {
  static getPolicy = async (req: Request, res: Response) => {
    const policy = await StageTransitionService.getStageSkipPolicy(req.user!.tenantId);
    return success(res, policy, 'Stage skip policy fetched');
  };

  static updatePolicy = async (req: Request, res: Response) => {
    const { enabled, mode } = req.body;
    const policy = await StageTransitionService.updateStageSkipPolicy(req.user!.tenantId, {
      mode: mode || 'global',
      enabled: enabled ?? false,
    });
    return success(res, policy, 'Stage skip policy updated');
  };

  static getTransitions = async (req: Request, res: Response) => {
    const entityId = req.params.entityId as string;
    const transitions = await StageTransitionService.getTransitions(req.user!.tenantId, entityId);
    return success(res, transitions, 'Transitions fetched');
  };

  static validateTransition = async (req: Request, res: Response) => {
    const { fromStageId, toStageId } = req.body;
    // Ensure entityType is typed correctly for the service
    const rawType = String(req.body.entityType || 'lead');
    const entityType: 'lead' | 'deal' = rawType === 'deal' ? 'deal' : 'lead';
    const result = await StageTransitionService.validateTransition(
      req.user!.tenantId,
      req.user!.id,
      req.user!.role,
      entityType,
      fromStageId,
      toStageId
    );
    return success(res, result, 'Transition validation complete');
  };
}
