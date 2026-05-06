import type { Request, Response } from 'express';
import { CommunicationService } from './communication.service.ts';
import { success } from '@/utils/response.ts';

export class CommunicationController {
  static list = async (req: Request, res: Response) => {
    const result = await CommunicationService.listCommunications(req.user!.tenantId, req.query);
    return success(res, result, 'Communications fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const comm = await CommunicationService.createCommunication(req.user!.tenantId, req.user!.id, req.body);
    return success(res, comm, 'Communication logged successfully', 201);
  };

  static get = async (req: Request, res: Response) => {
    const comm = await CommunicationService.getCommunication(req.user!.tenantId, req.params.id as string);
    return success(res, comm, 'Communication details fetched successfully');
  };

  static update = async (req: Request, res: Response) => {
    const comm = await CommunicationService.updateCommunication(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, comm, 'Communication updated successfully');
  };

  static delete = async (req: Request, res: Response) => {
    await CommunicationService.deleteCommunication(req.user!.tenantId, req.params.id as string);
    return success(res, null, 'Communication deleted successfully');
  };
}
