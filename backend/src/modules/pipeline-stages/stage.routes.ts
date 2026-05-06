import { Router } from 'express';
import { StageController } from './stage.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import rbacGuard from '@/middleware/rbacGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createStageSchema, 
  updateStageSchema, 
  archiveStageSchema, 
  migrateStageSchema, 
  reorderStagesSchema 
} from './stage.schemas.ts';

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
