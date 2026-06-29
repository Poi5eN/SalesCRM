import { ActivityService } from './activity.service.js';
import { success } from '../../utils/response.js';
export class ActivityController {
    static async list(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const activities = await ActivityService.listActivities(req.user.tenantId, limit);
        return success(res, activities);
    }
}
