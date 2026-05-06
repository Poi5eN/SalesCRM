import { Router } from 'express';
import { ActivityController } from './activity.controller.ts';
import authGuard from '@/middleware/authGuard.ts';
import tenantResolver from '@/middleware/tenantResolver.ts';

const router = Router();

router.use(authGuard, tenantResolver);

router.get('/', ActivityController.list);

export default router;
