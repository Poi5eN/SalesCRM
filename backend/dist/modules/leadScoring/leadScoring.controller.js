import { LeadScoringService } from './leadScoring.service.js';
import { success } from '../../utils/response.js';
import { DEFAULT_RULES } from './leadScoring.types.js';
export class LeadScoringController {
    static getRules = async (req, res) => {
        const rules = await LeadScoringService.getRules(req.user.tenantId);
        return success(res, rules, 'Lead scoring rules fetched successfully');
    };
    static updateRules = async (req, res) => {
        const rules = req.body;
        await LeadScoringService.updateRules(req.user.tenantId, rules);
        return success(res, rules, 'Lead scoring rules updated successfully');
    };
    static resetRules = async (req, res) => {
        await LeadScoringService.updateRules(req.user.tenantId, DEFAULT_RULES);
        return success(res, DEFAULT_RULES, 'Lead scoring rules reset to defaults');
    };
}
