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
router.use(rbacGuard('settings', 'update'));

router.get('/me', asyncHandler(TenantController.getMe));
router.patch('/me', validate(updateTenantSchema), asyncHandler(TenantController.updateMe));

router.get('/me/users', asyncHandler(TenantController.listUsers));
router.patch('/users/:id', validate(updateUserStatusRoleSchema), asyncHandler(TenantController.updateUser));
router.delete('/users/:id', validate(deleteUserSchema), asyncHandler(TenantController.deleteUser));

export default router;
