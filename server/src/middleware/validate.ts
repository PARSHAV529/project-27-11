import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

/** Validate request body against a Zod schema, forwarding ZodError to the error handler. */
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

/** Validate query parameters against a Zod schema and store parsed output on res.locals.query. */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.query = schema.parse(req.query);
    next();
  };
}

/** Validate route parameters against a Zod schema and store parsed output on res.locals.params. */
export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.params = schema.parse(req.params);
    next();
  };
}
