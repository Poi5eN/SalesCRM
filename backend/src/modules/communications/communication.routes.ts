import { Router } from 'express';
import { CommunicationController } from './communication.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createCommunicationSchema, 
  updateCommunicationSchema, 
  communicationFilterSchema 
} from './communication.schemas.ts';

const router = Router();

router.use(authGuard);

router.get('/', validate(communicationFilterSchema), asyncHandler(CommunicationController.list));
router.post('/', validate(createCommunicationSchema), asyncHandler(CommunicationController.create));

router.get('/:id', asyncHandler(CommunicationController.get));
router.patch('/:id', validate(updateCommunicationSchema), asyncHandler(CommunicationController.update));
router.delete('/:id', asyncHandler(CommunicationController.delete));

export default router;
