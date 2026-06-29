import { CommunicationService } from './communication.service.js';
import { success } from '../../utils/response.js';
export class CommunicationController {
    static list = async (req, res) => {
        const result = await CommunicationService.listCommunications(req.user.tenantId, req.query);
        return success(res, result, 'Communications fetched successfully');
    };
    static create = async (req, res) => {
        const comm = await CommunicationService.createCommunication(req.user.tenantId, req.user.id, req.body);
        return success(res, comm, 'Communication logged successfully', 201);
    };
    static get = async (req, res) => {
        const comm = await CommunicationService.getCommunication(req.user.tenantId, req.params.id);
        return success(res, comm, 'Communication details fetched successfully');
    };
    static update = async (req, res) => {
        const comm = await CommunicationService.updateCommunication(req.user.tenantId, req.params.id, req.body);
        return success(res, comm, 'Communication updated successfully');
    };
    static delete = async (req, res) => {
        await CommunicationService.deleteCommunication(req.user.tenantId, req.params.id);
        return success(res, null, 'Communication deleted successfully');
    };
}
