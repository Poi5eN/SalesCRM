import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import {
  predictDeal,
  predictPipeline,
  getActions,
} from './prediction.controller.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

router.get('/pipeline', predictPipeline);
router.get('/actions', getActions);
router.get('/deal/:id', predictDeal);

export default router;
