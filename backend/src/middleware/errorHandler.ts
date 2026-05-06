import type { Request, Response, NextFunction } from 'express';
import { error } from '@/utils/response.ts';
import { env } from '@/config/env.ts';

interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  errors?: any;
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  
  const responseData: any = {
    code,
  };

  if (env.NODE_ENV === 'development') {
    responseData.stack = err.stack;
  }

  if (err.errors) {
    responseData.errors = err.errors;
  }

  return error(res, message, statusCode, code, responseData.errors);
};

export default errorHandler;
