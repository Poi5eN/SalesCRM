import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { error } from '@/utils/response.ts';

const validate = (schema: z.ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return error(res, 'Validation Error', 400, 'VALIDATION_ERROR', err.issues);
      }
      return next(err);
    }
  };
};

export default validate;
