import { Router } from 'express';
import { LeadScoringController } from './leadScoring.controller.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';

const router = Router();

router.use(authGuard);

router.get('/rules', asyncHandler(LeadScoringController.getRules));
router.put('/rules', asyncHandler(LeadScoringController.updateRules));
router.post('/rules/reset', asyncHandler(LeadScoringController.resetRules));

export default router;
