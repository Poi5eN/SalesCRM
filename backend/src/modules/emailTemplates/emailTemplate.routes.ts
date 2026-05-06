import { Router } from 'express';
import { EmailTemplateController } from './emailTemplate.controller.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';

const router = Router();

router.use(authGuard);

router.get('/', asyncHandler(EmailTemplateController.listTemplates));
router.post('/', asyncHandler(EmailTemplateController.createTemplate));
router.get('/:id', asyncHandler(EmailTemplateController.getTemplate));
router.patch('/:id', asyncHandler(EmailTemplateController.updateTemplate));
router.delete('/:id', asyncHandler(EmailTemplateController.deleteTemplate));
router.post('/:id/preview', asyncHandler(EmailTemplateController.previewTemplate));

export default router;
