import type { Request, Response } from 'express';
import { StageService } from './stage.service.js';
import { success } from '@/utils/response.js';

export class StageController {
  static listStages = async (req: Request, res: Response) => {
    const { type } = req.query;
    const stages = await StageService.listStages(req.user!.tenantId, type as string);
    return success(res, stages, 'Stages fetched successfully');
  };

  static createStage = async (req: Request, res: Response) => {
    const stage = await StageService.createStage(req.user!.tenantId, req.body);
    return success(res, stage, 'Stage created successfully', 201);
  };

  static updateStage = async (req: Request, res: Response) => {
    const stage = await StageService.updateStage(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, stage, 'Stage updated successfully');
  };

  static archiveStage = async (req: Request, res: Response) => {
    const { transferToStageId } = req.body;
    const result = await StageService.archiveStage(req.user!.tenantId, req.params.id as string, transferToStageId);
    return success(res, result, 'Stage archived successfully');
  };

  static migrateRecords = async (req: Request, res: Response) => {
    const { targetStageId, reason } = req.body;
    const result = await StageService.migrateBulk(
      req.user!.tenantId,
      req.params.id as string,
      targetStageId,
      req.user!.id,
      reason
    );
    return success(res, result, 'Records migrated successfully');
  };

  static reorderStages = async (req: Request, res: Response) => {
    const result = await StageService.reorderStages(req.user!.tenantId, req.body);
    return success(res, result, 'Stages reordered successfully');
  };
}
