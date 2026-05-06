import { Router } from 'express';
import { ProposalController } from './proposal.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createProposalSchema, 
  updateProposalSchema, 
  addProposalItemSchema, 
  updateProposalItemSchema, 
  proposalFilterSchema,
  respondProposalSchema
} from './proposal.schemas.ts';

const router = Router();
const publicRouter = Router();

// Private Routes
router.use(authGuard);
router.get('/', validate(proposalFilterSchema), asyncHandler(ProposalController.list));
router.post('/', validate(createProposalSchema), asyncHandler(ProposalController.create));

router.get('/:id', asyncHandler(ProposalController.get));
router.patch('/:id', validate(updateProposalSchema), asyncHandler(ProposalController.update));

router.post('/:id/items', validate(addProposalItemSchema), asyncHandler(ProposalController.addItem));
router.patch('/:id/items/:itemId', validate(updateProposalItemSchema), asyncHandler(ProposalController.updateItem));
router.delete('/:id/items/:itemId', asyncHandler(ProposalController.removeItem));

router.post('/:id/revise', asyncHandler(ProposalController.revise));
router.post('/:id/send', asyncHandler(ProposalController.send));

// Public Routes
publicRouter.get('/:publicToken', asyncHandler(ProposalController.getPublic));
publicRouter.post('/:publicToken/respond', validate(respondProposalSchema), asyncHandler(ProposalController.respondPublic));

export { router as proposalRoutes, publicRouter as publicProposalRoutes };
