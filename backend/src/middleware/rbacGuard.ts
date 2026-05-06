import type { Request, Response, NextFunction } from 'express';
import { error } from '@/utils/response.ts';

const rbacGuard = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return error(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Example logic: check if user role is ADMIN or has specific permission
    // For now, let's assume permissions are strings like "leads:create"
    const requiredPermission = `${resource}:${action}`;
    const hasPermission = user.role === 'ADMIN' || req.permissions?.includes(requiredPermission);

    if (!hasPermission) {
      return error(res, 'Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};

export default rbacGuard;
