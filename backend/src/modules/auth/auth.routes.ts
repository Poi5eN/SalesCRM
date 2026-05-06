import { Router } from 'express';
import { AuthController } from './auth.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import rbacGuard from '@/middleware/rbacGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  registerTenantSchema, 
  loginSchema, 
  inviteUserSchema, 
  acceptInviteSchema 
} from './auth.schemas.ts';

const router = Router();

router.post(
  '/register-tenant', 
  validate(registerTenantSchema), 
  asyncHandler(AuthController.registerTenant)
);

router.post(
  '/login', 
  validate(loginSchema), 
  asyncHandler(AuthController.login)
);

router.post(
  '/refresh', 
  asyncHandler(AuthController.refresh)
);

router.post(
  '/logout', 
  authGuard, 
  asyncHandler(AuthController.logout)
);

router.post(
  '/invite', 
  authGuard, 
  rbacGuard('users', 'create'), 
  validate(inviteUserSchema), 
  asyncHandler(AuthController.invite)
);

router.post(
  '/accept-invite', 
  validate(acceptInviteSchema), 
  asyncHandler(AuthController.acceptInvite)
);

router.get(
  '/me', 
  authGuard, 
  asyncHandler(AuthController.me)
);

export default router;
