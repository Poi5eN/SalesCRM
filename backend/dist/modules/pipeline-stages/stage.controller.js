import { StageService } from './stage.service.js';
import { success } from '../../utils/response.js';
export class StageController {
    static listStages = async (req, res) => {
        const { type } = req.query;
        const stages = await StageService.listStages(req.user.tenantId, type);
        return success(res, stages, 'Stages fetched successfully');
    };
    static createStage = async (req, res) => {
        const stage = await StageService.createStage(req.user.tenantId, req.body);
        return success(res, stage, 'Stage created successfully', 201);
    };
    static updateStage = async (req, res) => {
        const stage = await StageService.updateStage(req.user.tenantId, req.params.id, req.body);
        return success(res, stage, 'Stage updated successfully');
    };
    static archiveStage = async (req, res) => {
        const { transferToStageId } = req.body;
        const result = await StageService.archiveStage(req.user.tenantId, req.params.id, transferToStageId);
        return success(res, result, 'Stage archived successfully');
    };
    static migrateRecords = async (req, res) => {
        const { targetStageId, reason } = req.body;
        const result = await StageService.migrateBulk(req.user.tenantId, req.params.id, targetStageId, req.user.id, reason);
        return success(res, result, 'Records migrated successfully');
    };
    static reorderStages = async (req, res) => {
        const result = await StageService.reorderStages(req.user.tenantId, req.body);
        return success(res, result, 'Stages reordered successfully');
    };
}
