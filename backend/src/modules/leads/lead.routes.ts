import { Router } from 'express';
import { LeadController } from './lead.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createLeadSchema, 
  updateLeadSchema, 
  convertLeadSchema, 
  leadFilterSchema 
} from './lead.schemas.ts';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: List leads with filters
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leads
 */
router.get('/', validate(leadFilterSchema), asyncHandler(LeadController.list));
router.get('/check-duplicate', asyncHandler(LeadController.checkDuplicate));

/**
 * @swagger
 * /api/leads/board:
 *   get:
 *     summary: Get lead board (stages with leads)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lead board data
 */
router.get('/board', asyncHandler(LeadController.getBoard));

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lead created
 */
router.post('/', validate(createLeadSchema), asyncHandler(LeadController.create));

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Get lead details
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead details
 */
router.get('/:id', asyncHandler(LeadController.get));

/**
 * @swagger
 * /api/leads/{id}:
 *   patch:
 *     summary: Update lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead updated
 */
router.patch('/:id', validate(updateLeadSchema), asyncHandler(LeadController.update));

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead deleted
 */
router.delete('/:id', asyncHandler(LeadController.delete));

/**
 * @swagger
 * /api/leads/{id}/assign:
 *   patch:
 *     summary: Assign lead to user
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead assigned
 */
router.patch('/:id/assign', asyncHandler(LeadController.assign));

/**
 * @swagger
 * /api/leads/{id}/convert:
 *   post:
 *     summary: Convert lead to deal
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead converted
 */
router.post('/:id/convert', validate(convertLeadSchema), asyncHandler(LeadController.convert));

/**
 * @swagger
 * /api/leads/{id}/timeline:
 *   get:
 *     summary: Get lead activity timeline
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lead timeline
 */
router.get('/:id/timeline', asyncHandler(LeadController.getTimeline));

export default router;
