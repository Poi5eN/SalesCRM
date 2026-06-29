import { Router } from 'express';
import { ContactController } from './contact.controller.js';
import validate from '@/middleware/validate.js';
import authGuard from '@/middleware/authGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { 
  createContactSchema, 
  updateContactSchema, 
  mergeContactsSchema, 
  contactFilterSchema 
} from './contact.schemas.js';

const router = Router();

router.use(authGuard);

router.get('/check-duplicate', asyncHandler(ContactController.checkDuplicate));
router.get('/', validate(contactFilterSchema), asyncHandler(ContactController.list));
router.post('/', validate(createContactSchema), asyncHandler(ContactController.create));

router.post('/merge', validate(mergeContactsSchema), asyncHandler(ContactController.merge));

router.get('/:id', asyncHandler(ContactController.get));
router.patch('/:id', validate(updateContactSchema), asyncHandler(ContactController.update));
router.delete('/:id', asyncHandler(ContactController.delete));

router.get('/:id/timeline', asyncHandler(ContactController.getTimeline));

export default router;
