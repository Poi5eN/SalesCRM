import { ContactService } from './contact.service.js';
import { success } from '../../utils/response.js';
export class ContactController {
    static list = async (req, res) => {
        const result = await ContactService.listContacts(req.user.tenantId, req.query);
        return success(res, result, 'Contacts fetched successfully');
    };
    static checkDuplicate = async (req, res) => {
        const { email, phone } = req.query;
        const duplicates = await ContactService.checkDuplicate(req.user.tenantId, email, phone);
        return res.json({ duplicates });
    };
    static create = async (req, res) => {
        const force = req.query.force === 'true';
        const result = await ContactService.createContact(req.user.tenantId, req.user.id, req.body, force);
        if ('duplicates' in result) {
            return res.status(409).json({
                success: false,
                message: 'Potential duplicates found',
                code: 'DUPLICATE_FOUND',
                duplicates: result.duplicates
            });
        }
        return success(res, result, 'Contact created successfully', 201);
    };
    static get = async (req, res) => {
        const contact = await ContactService.getContact(req.user.tenantId, req.params.id);
        return success(res, contact, 'Contact details fetched successfully');
    };
    static update = async (req, res) => {
        const contact = await ContactService.updateContact(req.user.tenantId, req.params.id, req.body);
        return success(res, contact, 'Contact updated successfully');
    };
    static delete = async (req, res) => {
        await ContactService.deleteContact(req.user.tenantId, req.params.id);
        return success(res, null, 'Contact deleted successfully');
    };
    static merge = async (req, res) => {
        const { sourceId, targetId } = req.body;
        const result = await ContactService.mergeContacts(req.user.tenantId, sourceId, targetId, req.user.id);
        return success(res, result, 'Contacts merged successfully');
    };
    static getTimeline = async (req, res) => {
        const timeline = await ContactService.getTimeline(req.user.tenantId, req.params.id);
        return success(res, timeline, 'Contact timeline fetched successfully');
    };
}
