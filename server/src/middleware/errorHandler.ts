import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

interface MongoDuplicateKeyError {
  code?: number;
  keyValue?: Record<string, unknown>;
}

/** Return 404 for any unmatched route. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralized error handler formatting validation, database, JWT, and app errors. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Array<{ field: string; message: string }> | unknown[] = [];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if ((err as MongoDuplicateKeyError)?.code === 11000) {
    statusCode = 409;
    const keyValue = (err as MongoDuplicateKeyError).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? 'field';
    message = field === 'email' ? 'Email already registered' : `Duplicate value for ${field}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((fieldErr) => ({
      field: fieldErr.path,
      message: fieldErr.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${String(err.value)}`;
  } else if (
    err instanceof Error &&
    (err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError' ||
      err.name === 'NotBeforeError')
  ) {
    statusCode = 401;
    message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (
    err instanceof Error &&
    'status' in err &&
    typeof (err as { status?: unknown }).status === 'number'
  ) {
    const httpErr = err as Error & { status: number; type?: string };
    statusCode = httpErr.status;
    message = httpErr.type === 'entity.too.large' ? 'Request payload is too large' : httpErr.message;
  } else if (err instanceof Error) {
    message = env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
  }

  if (env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 ? { errors } : {}),
    ...(env.NODE_ENV !== 'production' && err instanceof Error ? { stack: err.stack } : {}),
  });
};
