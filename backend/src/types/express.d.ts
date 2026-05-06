import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
      };
      tenant?: {
        id: string;
        name: string;
      };
      permissions?: string[];
    }
  }
}

export {};
