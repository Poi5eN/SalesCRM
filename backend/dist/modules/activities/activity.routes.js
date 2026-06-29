import { Router } from 'express';
import { ActivityController } from './activity.controller.js';
import authGuard from '../../middleware/authGuard.js';
import tenantResolver from '../../middleware/tenantResolver.js';
const router = Router();
router.use(authGuard, tenantResolver);
router.get('/', ActivityController.list);
export default router;
