import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import {
  getIntegrations,
  updateIntegrations,
  verifyWhatsApp,
  connectCalendar,
  syncWhatsApp,
} from './integration.controller.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

router.get('/', getIntegrations);
router.patch('/', updateIntegrations);
router.post('/whatsapp/verify', verifyWhatsApp);
router.post('/calendar/connect', connectCalendar);
router.post('/whatsapp/sync', syncWhatsApp);

export default router;
