import { success, error } from '../../utils/response.js';
import * as analyticsService from './analytics.service.js';
export const getSummary = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const period = req.query.period || '30d';
        const summary = await analyticsService.getAnalyticsSummary(tenantId, period);
        return success(res, summary, 'Analytics summary retrieved successfully');
    }
    catch (err) {
        console.error('Analytics Error:', err);
        return error(res, 'Failed to retrieve analytics summary', 500);
    }
};
export const getHeatmap = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const heatmap = await analyticsService.getActivityHeatmap(tenantId);
        return success(res, heatmap, 'Activity heatmap retrieved successfully');
    }
    catch (err) {
        return error(res, 'Failed to retrieve activity heatmap', 500);
    }
};
