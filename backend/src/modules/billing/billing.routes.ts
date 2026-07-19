import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import rbacGuard from '@/middleware/rbacGuard.js';
import {
  getPlans,
  getSubscription,
  changePlan,
  updateBillingEmail,
  checkUsage,
} from './billing.controller.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

router.get('/plans', getPlans);
router.get('/subscription', getSubscription);
router.post('/change-plan', rbacGuard('settings', 'update'), changePlan);
router.patch('/billing-email', updateBillingEmail);
router.get('/usage', checkUsage);

export default router;
