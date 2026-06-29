import { EmailTemplateService } from './emailTemplate.service.js';
import { success } from '../../utils/response.js';
export class EmailTemplateController {
    static listTemplates = async (req, res) => {
        const templates = await EmailTemplateService.listTemplates(req.user.tenantId);
        return success(res, templates, 'Email templates fetched successfully');
    };
    static createTemplate = async (req, res) => {
        const template = await EmailTemplateService.createTemplate(req.user.tenantId, req.user.id, req.body);
        return success(res, template, 'Email template created successfully');
    };
    static getTemplate = async (req, res) => {
        const template = await EmailTemplateService.getTemplate(req.user.tenantId, req.params.id);
        return success(res, template, 'Email template fetched successfully');
    };
    static updateTemplate = async (req, res) => {
        const template = await EmailTemplateService.updateTemplate(req.user.tenantId, req.params.id, req.body);
        return success(res, template, 'Email template updated successfully');
    };
    static deleteTemplate = async (req, res) => {
        await EmailTemplateService.deleteTemplate(req.user.tenantId, req.params.id);
        return success(res, null, 'Email template deleted successfully');
    };
    static previewTemplate = async (req, res) => {
        const preview = await EmailTemplateService.previewTemplate(req.user.tenantId, req.params.id, req.body, req.user.id);
        return success(res, preview, 'Template preview generated successfully');
    };
}
