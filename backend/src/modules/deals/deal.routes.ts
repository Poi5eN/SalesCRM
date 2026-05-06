import { Router } from 'express';
import { DealController } from './deal.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createDealSchema, 
  updateDealSchema, 
  addProductToDealSchema, 
  dealFilterSchema 
} from './deal.schemas.ts';

const router = Router();

router.use(authGuard);

router.get('/', validate(dealFilterSchema), asyncHandler(DealController.list));
router.get('/board', asyncHandler(DealController.getBoard));
router.get('/forecast', asyncHandler(DealController.getForecast));
router.post('/', validate(createDealSchema), asyncHandler(DealController.create));

router.get('/:id', asyncHandler(DealController.get));
router.patch('/:id', validate(updateDealSchema), asyncHandler(DealController.update));
router.delete('/:id', asyncHandler(DealController.delete));

router.post('/:id/products', validate(addProductToDealSchema), asyncHandler(DealController.addProduct));
router.delete('/:id/products/:productId', asyncHandler(DealController.removeProduct));

router.get('/:id/timeline', asyncHandler(DealController.getTimeline));

export default router;
