import { Router } from 'express';
import { StageTransitionController } from './stageTransition.controller.js';
import authGuard from '@/middleware/authGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/stage-transitions/policy:
 *   get:
 *     summary: Get stage skip policy for the tenant
 *     tags: [Stage Transitions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stage skip policy
 */
router.get('/policy', asyncHandler(StageTransitionController.getPolicy));

/**
 * @swagger
 * /api/stage-transitions/policy:
 *   patch:
 *     summary: Update stage skip policy
 *     tags: [Stage Transitions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Policy updated
 */
router.patch('/policy', asyncHandler(StageTransitionController.updatePolicy));

/**
 * @swagger
 * /api/stage-transitions/validate:
 *   post:
 *     summary: Validate whether a stage transition is allowed
 *     tags: [Stage Transitions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/validate', asyncHandler(StageTransitionController.validateTransition));

/**
 * @swagger
 * /api/stage-transitions/{entityId}:
 *   get:
 *     summary: Get stage transitions for an entity
 *     tags: [Stage Transitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of transitions
 */
router.get('/:entityId', asyncHandler(StageTransitionController.getTransitions));

export default router;
