import { Router } from 'express';
import { RBACController } from './rbac.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import rbacGuard from '@/middleware/rbacGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { createRoleSchema, updateRolePermissionsSchema } from './rbac.schemas.ts';

const router = Router();

// All RBAC routes require auth + admin role
router.use(authGuard);
router.use(rbacGuard('settings', 'update')); // Using settings:update as a proxy for admin power

router.get('/roles', asyncHandler(RBACController.listRoles));
router.post('/roles', validate(createRoleSchema), asyncHandler(RBACController.createRole));
router.get('/roles/:id', asyncHandler(RBACController.getRole));
router.put('/roles/:id/permissions', validate(updateRolePermissionsSchema), asyncHandler(RBACController.updatePermissions));
router.delete('/roles/:id', asyncHandler(RBACController.deleteRole));

router.get('/permissions', asyncHandler(RBACController.listPermissions));

// Internal/Admin seed
router.post('/seed-defaults', asyncHandler(RBACController.seedDefaults));

export default router;
