import { Router } from 'express';
import { ProposalController } from './proposal.controller.js';
import validate from '@/middleware/validate.js';
import authGuard from '@/middleware/authGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { 
  createProposalSchema, 
  updateProposalSchema, 
  addProposalItemSchema, 
  updateProposalItemSchema, 
  proposalFilterSchema,
  respondProposalSchema
} from './proposal.schemas.js';

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
