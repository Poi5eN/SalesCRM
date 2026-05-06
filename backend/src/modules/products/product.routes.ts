import { Router } from 'express';
import { ProductController } from './product.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createProductSchema, 
  updateProductSchema, 
  productFilterSchema 
} from './product.schemas.ts';

const router = Router();

router.use(authGuard);

router.get('/', validate(productFilterSchema), asyncHandler(ProductController.list));
router.post('/', validate(createProductSchema), asyncHandler(ProductController.create));

router.get('/:id', asyncHandler(ProductController.get));
router.patch('/:id', validate(updateProductSchema), asyncHandler(ProductController.update));
router.delete('/:id', asyncHandler(ProductController.delete));

export default router;
