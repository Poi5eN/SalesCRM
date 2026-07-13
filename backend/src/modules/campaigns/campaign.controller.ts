import type { Request, Response } from 'express';
import { CampaignService } from './campaign.service.js';
import { success } from '@/utils/response.js';

export class CampaignController {
  static list = async (req: Request, res: Response) => {
    const result = await CampaignService.listCampaigns(req.user!.tenantId, req.query);
    return success(res, result, 'Campaigns fetched successfully');
  };

  static get = async (req: Request, res: Response) => {
    const campaign = await CampaignService.getCampaign(req.user!.tenantId, req.params.id as string);
    return success(res, campaign, 'Campaign details fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const campaign = await CampaignService.createCampaign(req.user!.tenantId, req.body);
    return success(res, campaign, 'Campaign created successfully', 201);
  };

  static update = async (req: Request, res: Response) => {
    const campaign = await CampaignService.updateCampaign(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, campaign, 'Campaign updated successfully');
  };

  static delete = async (req: Request, res: Response) => {
    await CampaignService.deleteCampaign(req.user!.tenantId, req.params.id as string);
    return success(res, null, 'Campaign deleted successfully');
  };
}
