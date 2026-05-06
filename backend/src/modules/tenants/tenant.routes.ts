import { Router } from 'express';
import { TenantController } from './tenant.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import rbacGuard from '@/middleware/rbacGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  updateTenantSchema, 
  updateUserStatusRoleSchema, 
  deleteUserSchema 
} from './tenant.schemas.ts';

const router = Router();

router.use(authGuard);
router.use(rbacGuard('settings', 'update'));

router.get('/me', asyncHandler(TenantController.getMe));
router.patch('/me', validate(updateTenantSchema), asyncHandler(TenantController.updateMe));

router.get('/me/users', asyncHandler(TenantController.listUsers));
router.patch('/users/:id', validate(updateUserStatusRoleSchema), asyncHandler(TenantController.updateUser));
router.delete('/users/:id', validate(deleteUserSchema), asyncHandler(TenantController.deleteUser));

export default router;
