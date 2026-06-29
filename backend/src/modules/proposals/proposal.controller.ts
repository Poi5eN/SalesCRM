import type { Request, Response } from 'express';
import { ProposalService } from './proposal.service.js';
import { success } from '@/utils/response.js';

export class ProposalController {
  static list = async (req: Request, res: Response) => {
    const result = await ProposalService.listProposals(req.user!.tenantId, req.query);
    return success(res, result, 'Proposals fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const proposal = await ProposalService.createProposal(req.user!.tenantId, req.user!.id, req.body);
    return success(res, proposal, 'Proposal created successfully', 201);
  };

  static get = async (req: Request, res: Response) => {
    const proposal = await ProposalService.getProposal(req.user!.tenantId, req.params.id as string);
    return success(res, proposal, 'Proposal details fetched successfully');
  };

  static update = async (req: Request, res: Response) => {
    const proposal = await ProposalService.updateProposal(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, proposal, 'Proposal updated successfully');
  };

  static addItem = async (req: Request, res: Response) => {
    const proposal = await ProposalService.addItem(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, proposal, 'Item added to proposal successfully');
  };

  static updateItem = async (req: Request, res: Response) => {
    const proposal = await ProposalService.updateItem(req.user!.tenantId, req.params.id as string, req.params.itemId as string, req.body);
    return success(res, proposal, 'Item updated successfully');
  };

  static removeItem = async (req: Request, res: Response) => {
    const proposal = await ProposalService.removeItem(req.user!.tenantId, req.params.id as string, req.params.itemId as string);
    return success(res, proposal, 'Item removed successfully');
  };

  static revise = async (req: Request, res: Response) => {
    const proposal = await ProposalService.reviseProposal(req.user!.tenantId, req.params.id as string, req.user!.id);
    return success(res, proposal, 'Proposal revision created successfully');
  };

  static send = async (req: Request, res: Response) => {
    const result = await ProposalService.sendProposal(req.user!.tenantId, req.params.id as string);
    return success(res, result, 'Proposal sent successfully');
  };

  // Public Endpoints
  static getPublic = async (req: Request, res: Response) => {
    const proposal = await ProposalService.getPublicProposal(req.params.publicToken as string);
    return success(res, proposal, 'Proposal fetched successfully');
  };

  static respondPublic = async (req: Request, res: Response) => {
    const { response, comment } = req.body;
    const result = await ProposalService.respondPublicly(req.params.publicToken as string, response, comment);
    return success(res, result, `Proposal ${response} successfully`);
  };
}
