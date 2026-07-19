import { Request, Response } from 'express';
import { PredictionService } from './prediction.service.js';
import { success } from '@/utils/response.js';
import asyncHandler from '@/utils/asyncHandler.js';

export const predictDeal = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const prediction = await PredictionService.predictDealWin(id);
  return success(res, prediction, 'Deal prediction generated');
});

export const predictPipeline = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const prediction = await PredictionService.predictPipeline(tenantId);
  return success(res, prediction, 'Pipeline prediction generated');
});

export const getActions = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const actions = await PredictionService.getNextBestActions(tenantId, userId);
  return success(res, actions, 'Next best actions fetched');
});
