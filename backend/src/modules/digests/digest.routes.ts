import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import rbacGuard from '@/middleware/rbacGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { DigestService } from './digest.service.js';
import { success } from '@/utils/response.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

// Admin endpoint to manually trigger lost-leads digest
router.post('/lost-leads', rbacGuard('reports', 'read'), asyncHandler(async (req, res) => {
  const tenantId = req.user!.tenantId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await DigestService.generateTenantLostLeadsDigest(tenantId, startOfMonth, endOfMonth);
  return success(res, result || { notified: false, reason: 'No lost leads found' }, 'Lost leads digest generated');
}));

export default router;
