import { ProposalService } from './proposal.service.js';
import { success } from '../../utils/response.js';
export class ProposalController {
    static list = async (req, res) => {
        const result = await ProposalService.listProposals(req.user.tenantId, req.query);
        return success(res, result, 'Proposals fetched successfully');
    };
    static create = async (req, res) => {
        const proposal = await ProposalService.createProposal(req.user.tenantId, req.user.id, req.body);
        return success(res, proposal, 'Proposal created successfully', 201);
    };
    static get = async (req, res) => {
        const proposal = await ProposalService.getProposal(req.user.tenantId, req.params.id);
        return success(res, proposal, 'Proposal details fetched successfully');
    };
    static update = async (req, res) => {
        const proposal = await ProposalService.updateProposal(req.user.tenantId, req.params.id, req.body);
        return success(res, proposal, 'Proposal updated successfully');
    };
    static addItem = async (req, res) => {
        const proposal = await ProposalService.addItem(req.user.tenantId, req.params.id, req.body);
        return success(res, proposal, 'Item added to proposal successfully');
    };
    static updateItem = async (req, res) => {
        const proposal = await ProposalService.updateItem(req.user.tenantId, req.params.id, req.params.itemId, req.body);
        return success(res, proposal, 'Item updated successfully');
    };
    static removeItem = async (req, res) => {
        const proposal = await ProposalService.removeItem(req.user.tenantId, req.params.id, req.params.itemId);
        return success(res, proposal, 'Item removed successfully');
    };
    static revise = async (req, res) => {
        const proposal = await ProposalService.reviseProposal(req.user.tenantId, req.params.id, req.user.id);
        return success(res, proposal, 'Proposal revision created successfully');
    };
    static send = async (req, res) => {
        const result = await ProposalService.sendProposal(req.user.tenantId, req.params.id);
        return success(res, result, 'Proposal sent successfully');
    };
    // Public Endpoints
    static getPublic = async (req, res) => {
        const proposal = await ProposalService.getPublicProposal(req.params.publicToken);
        return success(res, proposal, 'Proposal fetched successfully');
    };
    static respondPublic = async (req, res) => {
        const { response, comment } = req.body;
        const result = await ProposalService.respondPublicly(req.params.publicToken, response, comment);
        return success(res, result, `Proposal ${response} successfully`);
    };
}
