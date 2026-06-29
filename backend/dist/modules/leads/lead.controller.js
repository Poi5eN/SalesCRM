import { LeadService } from './lead.service.js';
import { success } from '../../utils/response.js';
export class LeadController {
    static list = async (req, res) => {
        const result = await LeadService.listLeads(req.user.tenantId, req.query);
        return success(res, result, 'Leads fetched successfully');
    };
    static checkDuplicate = async (req, res) => {
        const { title, contactId, companyId } = req.query;
        const duplicates = await LeadService.checkDuplicate(req.user.tenantId, title, contactId, companyId);
        return res.json({ duplicates });
    };
    static getBoard = async (req, res) => {
        const result = await LeadService.getLeadBoard(req.user.tenantId);
        return success(res, result, 'Lead board fetched successfully');
    };
    static create = async (req, res) => {
        const lead = await LeadService.createLead(req.user.tenantId, req.user.id, req.body);
        return success(res, lead, 'Lead created successfully', 201);
    };
    static get = async (req, res) => {
        const lead = await LeadService.getLead(req.user.tenantId, req.params.id);
        return success(res, lead, 'Lead details fetched successfully');
    };
    static update = async (req, res) => {
        const lead = await LeadService.updateLead(req.user.tenantId, req.params.id, req.body, req.user.id);
        return success(res, lead, 'Lead updated successfully');
    };
    static delete = async (req, res) => {
        await LeadService.updateLead(req.user.tenantId, req.params.id, { deletedAt: new Date() }, req.user.id);
        return success(res, null, 'Lead deleted successfully');
    };
    static assign = async (req, res) => {
        const { assignedToId } = req.body;
        const lead = await LeadService.assignLead(req.user.tenantId, req.params.id, assignedToId, req.user.id);
        return success(res, lead, 'Lead reassigned successfully');
    };
    static convert = async (req, res) => {
        const result = await LeadService.convertToDeal(req.user.tenantId, req.params.id, req.body, req.user.id);
        return success(res, result, 'Lead converted to deal successfully');
    };
    static getTimeline = async (req, res) => {
        const timeline = await LeadService.getTimeline(req.user.tenantId, req.params.id);
        return success(res, timeline, 'Lead timeline fetched successfully');
    };
}
