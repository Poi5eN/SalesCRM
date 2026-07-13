import { Router } from 'express';
import { CampaignController } from './campaign.controller.js';
import validate from '@/middleware/validate.js';
import authGuard from '@/middleware/authGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { 
  createCampaignSchema, 
  updateCampaignSchema, 
  campaignFilterSchema 
} from './campaign.schemas.js';

const router = Router();

router.use(authGuard);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: List campaigns with filters
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get('/', validate(campaignFilterSchema), asyncHandler(CampaignController.list));

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Campaign created
 */
router.post('/', validate(createCampaignSchema), asyncHandler(CampaignController.create));

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign details
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign details
 */
router.get('/:id', asyncHandler(CampaignController.get));

/**
 * @swagger
 * /api/campaigns/{id}:
 *   patch:
 *     summary: Update campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign updated
 */
router.patch('/:id', validate(updateCampaignSchema), asyncHandler(CampaignController.update));

/**
 * @swagger
 * /api/campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign deleted
 */
router.delete('/:id', asyncHandler(CampaignController.delete));

export default router;
