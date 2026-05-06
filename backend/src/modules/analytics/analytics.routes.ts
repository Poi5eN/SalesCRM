import { Router } from 'express';
import * as analyticsController from './analytics.controller.ts';
import authGuard from '@/middleware/authGuard.ts';

const router = Router();

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get analytics summary for the tenant
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 12m]
 *         description: Period for which to get the summary
 *     responses:
 *       200:
 *         description: Analytics summary retrieved successfully
 */
router.get('/summary', authGuard, analyticsController.getSummary);

/**
 * @swagger
 * /api/analytics/heatmap:
 *   get:
 *     summary: Get activity heatmap for the tenant
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity heatmap retrieved successfully
 */
router.get('/heatmap', authGuard, analyticsController.getHeatmap);

export default router;
