import { Router } from 'express';
import { ContactController } from './contact.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createContactSchema, 
  updateContactSchema, 
  mergeContactsSchema, 
  contactFilterSchema 
} from './contact.schemas.ts';

const router = Router();

router.use(authGuard);

router.get('/', validate(contactFilterSchema), asyncHandler(ContactController.list));
router.post('/', validate(createContactSchema), asyncHandler(ContactController.create));

router.post('/merge', validate(mergeContactsSchema), asyncHandler(ContactController.merge));

router.get('/:id', asyncHandler(ContactController.get));
router.patch('/:id', validate(updateContactSchema), asyncHandler(ContactController.update));
router.delete('/:id', asyncHandler(ContactController.delete));

router.get('/:id/timeline', asyncHandler(ContactController.getTimeline));

export default router;
