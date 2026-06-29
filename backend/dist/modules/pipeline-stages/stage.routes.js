import { Router } from 'express';
import { StageController } from './stage.controller.js';
import validate from '../../middleware/validate.js';
import authGuard from '../../middleware/authGuard.js';
import rbacGuard from '../../middleware/rbacGuard.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { createStageSchema, updateStageSchema, archiveStageSchema, migrateStageSchema, reorderStagesSchema } from './stage.schemas.js';
const router = Router();
router.use(authGuard);
// Read-only access for all users
router.get('/', asyncHandler(StageController.listStages));
// Admin only actions
router.post('/', rbacGuard('settings', 'update'), validate(createStageSchema), asyncHandler(StageController.createStage));
router.patch('/reorder', rbacGuard('settings', 'update'), validate(reorderStagesSchema), asyncHandler(StageController.reorderStages));
router.patch('/:id', rbacGuard('settings', 'update'), validate(updateStageSchema), asyncHandler(StageController.updateStage));
router.post('/:id/archive', rbacGuard('settings', 'update'), validate(archiveStageSchema), asyncHandler(StageController.archiveStage));
router.post('/:id/migrate', rbacGuard('settings', 'update'), validate(migrateStageSchema), asyncHandler(StageController.migrateRecords));
export default router;
