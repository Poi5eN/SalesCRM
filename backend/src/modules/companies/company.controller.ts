import type { Request, Response } from 'express';
import { CompanyService } from './company.service.js';
import { success } from '@/utils/response.js';

export class CompanyController {
  static list = async (req: Request, res: Response) => {
    const result = await CompanyService.listCompanies(req.user!.tenantId, req.query);
    return success(res, result, 'Companies fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const company = await CompanyService.createCompany(req.user!.tenantId, req.user!.id, req.body);
    return success(res, company, 'Company created successfully', 201);
  };

  static get = async (req: Request, res: Response) => {
    const company = await CompanyService.getCompany(req.user!.tenantId, req.params.id as string);
    return success(res, company, 'Company details fetched successfully');
  };

  static update = async (req: Request, res: Response) => {
    const company = await CompanyService.updateCompany(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, company, 'Company updated successfully');
  };

  static delete = async (req: Request, res: Response) => {
    await CompanyService.deleteCompany(req.user!.tenantId, req.params.id as string);
    return success(res, null, 'Company deleted successfully');
  };

  static getContacts = async (req: Request, res: Response) => {
    const contacts = await CompanyService.listContacts(req.user!.tenantId, req.params.id as string);
    return success(res, contacts, 'Company contacts fetched successfully');
  };

  static getDeals = async (req: Request, res: Response) => {
    const deals = await CompanyService.listDeals(req.user!.tenantId, req.params.id as string);
    return success(res, deals, 'Company deals fetched successfully');
  };
}
