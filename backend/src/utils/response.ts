import type { Response } from 'express';

export const success = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const error = (
  res: Response,
  message = 'Error occurred',
  statusCode = 500,
  code?: string,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code: code || 'INTERNAL_SERVER_ERROR',
    errors,
  });
};
