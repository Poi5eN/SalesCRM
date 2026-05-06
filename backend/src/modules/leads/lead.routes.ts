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

router.get('/', validate(leadFilterSchema), asyncHandler(LeadController.list));
router.get('/board', asyncHandler(LeadController.getBoard));
router.post('/', validate(createLeadSchema), asyncHandler(LeadController.create));

router.get('/:id', asyncHandler(LeadController.get));
router.patch('/:id', validate(updateLeadSchema), asyncHandler(LeadController.update));
router.delete('/:id', asyncHandler(LeadController.delete));

router.patch('/:id/assign', asyncHandler(LeadController.assign));
router.post('/:id/convert', validate(convertLeadSchema), asyncHandler(LeadController.convert));
router.get('/:id/timeline', asyncHandler(LeadController.getTimeline));

export default router;
