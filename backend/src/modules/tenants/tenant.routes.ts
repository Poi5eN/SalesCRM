import { Router } from 'express';
import { TenantController } from './tenant.controller.js';
import validate from '@/middleware/validate.js';
import authGuard from '@/middleware/authGuard.js';
import rbacGuard from '@/middleware/rbacGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { 
  updateTenantSchema, 
  updateUserStatusRoleSchema, 
  deleteUserSchema 
} from './tenant.schemas.js';

const router = Router();

router.use(authGuard);

// Read endpoints — no RBAC gating needed
router.get('/me', asyncHandler(TenantController.getMe));
router.get('/me/users', asyncHandler(TenantController.listUsers));

// Write endpoints — require settings:update permission
router.patch('/me', rbacGuard('settings', 'update'), validate(updateTenantSchema), asyncHandler(TenantController.updateMe));
router.patch('/users/:id', rbacGuard('settings', 'update'), validate(updateUserStatusRoleSchema), asyncHandler(TenantController.updateUser));
router.delete('/users/:id', rbacGuard('settings', 'update'), validate(deleteUserSchema), asyncHandler(TenantController.deleteUser));

export default router;
