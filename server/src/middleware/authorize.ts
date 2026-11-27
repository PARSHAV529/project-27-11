import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

/** Restrict route access to users whose role is in the allowed list. */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, 'Forbidden: insufficient permissions'));
      return;
    }

    next();
  };
}
