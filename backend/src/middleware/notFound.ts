import type { Request, Response, NextFunction } from 'express';
import { error } from '@/utils/response.js';

const notFound = (req: Request, res: Response, next: NextFunction) => {
  return error(res, `Not Found - ${req.originalUrl}`, 404, 'NOT_FOUND');
};

export default notFound;
