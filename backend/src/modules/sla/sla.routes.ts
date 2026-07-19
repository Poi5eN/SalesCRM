import { Router } from 'express';
import { SLAController } from './sla.controller.js';
import authGuard from '@/middleware/authGuard.js';
import rbacGuard from '@/middleware/rbacGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/sla/config:
 *   get:
 *     summary: Get SLA configuration
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA config
 */
router.get('/config', asyncHandler(SLAController.getConfig));

/**
 * @swagger
 * /api/sla/config:
 *   patch:
 *     summary: Update SLA configuration
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA config updated
 */
router.patch('/config', asyncHandler(SLAController.updateConfig));

/**
 * @swagger
 * /api/sla/check:
 *   post:
 *     summary: Run SLA breach check and auto-reassign
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA check complete
 */
router.post('/check', asyncHandler(SLAController.runCheck));

/**
 * @swagger
 * /api/sla/at-risk:
 *   get:
 *     summary: Get count of leads at risk of SLA breach
 *     tags: [SLA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: At-risk count
 */
router.get('/at-risk', asyncHandler(SLAController.getAtRisk));

export default router;
