import type { Request, Response } from 'express';
import { LeadService } from './lead.service.js';
import { success } from '@/utils/response.js';

export class LeadController {
  static list = async (req: Request, res: Response) => {
    const result = await LeadService.listLeads(req.user!.tenantId, req.query);
    return success(res, result, 'Leads fetched successfully');
  };

  static checkDuplicate = async (req: Request, res: Response) => {
    const { title, contactId, companyId } = req.query as { title: string; contactId?: string; companyId?: string };
    const duplicates = await LeadService.checkDuplicate(req.user!.tenantId, title, contactId, companyId);
    return res.json({ duplicates });
  };

  static getBoard = async (req: Request, res: Response) => {
    const result = await LeadService.getLeadBoard(req.user!.tenantId);
    return success(res, result, 'Lead board fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const lead = await LeadService.createLead(req.user!.tenantId, req.user!.id, req.body);
    return success(res, lead, 'Lead created successfully', 201);
  };

  static get = async (req: Request, res: Response) => {
    const lead = await LeadService.getLead(req.user!.tenantId, req.params.id as string);
    return success(res, lead, 'Lead details fetched successfully');
  };

  static update = async (req: Request, res: Response) => {
    const lead = await LeadService.updateLead(req.user!.tenantId, req.params.id as string, req.body, req.user!.id);
    return success(res, lead, 'Lead updated successfully');
  };

  static delete = async (req: Request, res: Response) => {
    await LeadService.updateLead(req.user!.tenantId, req.params.id as string, { deletedAt: new Date() }, req.user!.id);
    return success(res, null, 'Lead deleted successfully');
  };

  static assign = async (req: Request, res: Response) => {
    const { assignedToId } = req.body;
    const lead = await LeadService.assignLead(req.user!.tenantId, req.params.id as string, assignedToId, req.user!.id);
    return success(res, lead, 'Lead reassigned successfully');
  };

  static convert = async (req: Request, res: Response) => {
    const result = await LeadService.convertToDeal(req.user!.tenantId, req.params.id as string, req.body, req.user!.id);
    return success(res, result, 'Lead converted to deal successfully');
  };

  static getTimeline = async (req: Request, res: Response) => {
    const timeline = await LeadService.getTimeline(req.user!.tenantId, req.params.id as string);
    return success(res, timeline, 'Lead timeline fetched successfully');
  };
}
