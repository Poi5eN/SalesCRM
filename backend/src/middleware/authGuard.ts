import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt.ts';
import { env } from '@/config/env.ts';
import { error } from '@/utils/response.ts';
import type { AuthUser } from '@/types/index.ts';

const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, 'Unauthorized - No token provided', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return error(res, 'Unauthorized - No token provided', 401, 'UNAUTHORIZED');
  }

  const decoded = verifyToken(token, env.JWT_SECRET);
  if (!decoded) {
    return error(res, 'Unauthorized - Invalid or expired token', 401, 'UNAUTHORIZED');
  }

  req.user = decoded as AuthUser;
  next();
};

export default authGuard;
