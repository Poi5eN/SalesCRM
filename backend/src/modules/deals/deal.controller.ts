import type { Request, Response } from 'express';
import { DealService } from './deal.service.ts';
import { success } from '@/utils/response.ts';

export class DealController {
  static list = async (req: Request, res: Response) => {
    const result = await DealService.listDeals(req.user!.tenantId, req.query);
    return success(res, result, 'Deals fetched successfully');
  };

  static getBoard = async (req: Request, res: Response) => {
    const result = await DealService.getDealBoard(req.user!.tenantId);
    return success(res, result, 'Deal board fetched successfully');
  };

  static getForecast = async (req: Request, res: Response) => {
    const result = await DealService.getForecast(req.user!.tenantId);
    return success(res, result, 'Sales forecast fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const deal = await DealService.createDeal(req.user!.tenantId, req.user!.id, req.body);
    return success(res, deal, 'Deal created successfully', 201);
  };

  static get = async (req: Request, res: Response) => {
    const deal = await DealService.getDeal(req.user!.tenantId, req.params.id as string);
    return success(res, deal, 'Deal details fetched successfully');
  };

  static update = async (req: Request, res: Response) => {
    const deal = await DealService.updateDeal(req.user!.tenantId, req.params.id as string, req.body, req.user!.id);
    return success(res, deal, 'Deal updated successfully');
  };

  static delete = async (req: Request, res: Response) => {
    await DealService.updateDeal(req.user!.tenantId, req.params.id as string, { deletedAt: new Date() }, req.user!.id);
    return success(res, null, 'Deal deleted successfully');
  };

  static addProduct = async (req: Request, res: Response) => {
    const result = await DealService.addProduct(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, result, 'Product added to deal successfully');
  };

  static removeProduct = async (req: Request, res: Response) => {
    await DealService.removeProduct(req.user!.tenantId, req.params.id as string, req.params.productId as string);
    return success(res, null, 'Product removed from deal successfully');
  };

  static getTimeline = async (req: Request, res: Response) => {
    const timeline = await DealService.getTimeline(req.user!.tenantId, req.params.id as string);
    return success(res, timeline, 'Deal timeline fetched successfully');
  };
}
