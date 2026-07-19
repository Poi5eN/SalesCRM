import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import { addComment, getComments } from './comment.controller.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

router.post('/', addComment);
router.get('/:entityType/:entityId', getComments);

export default router;
