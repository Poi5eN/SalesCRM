import type { Request, Response, NextFunction } from 'express';
import { error } from '@/utils/response.ts';

import prisma from '@/config/database.ts';

const rbacGuard = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return error(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Platform level superAdmin has access to everything
    if (user.role === 'superAdmin') {
      return next();
    }

    // Fetch permissions if not already attached (or use a cache)
    if (!req.permissions) {
      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!userWithRoles) {
        return error(res, 'User not found', 404, 'USER_NOT_FOUND');
      }

      req.permissions = userWithRoles.userRoles.flatMap(ur => 
        ur.role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`)
      );
    }

    const requiredPermission = `${resource}:${action}`;
    const hasPermission = user.role === 'admin' || req.permissions?.includes(requiredPermission);

    if (!hasPermission) {
      return error(res, 'Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

export default rbacGuard;
