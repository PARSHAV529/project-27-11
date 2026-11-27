// Temporarily disabled due to Vercel deployment TS2349 error on express-rate-limit types.
// import type { NextFunction, Request, Response } from 'express';
// import rateLimit from 'express-rate-limit';
// import { env } from '../config/env.js';
// import { AppError } from '../utils/AppError.js';
//
// function createRateLimitHandler() {
//   return (_req: Request, _res: Response, next: NextFunction): void => {
//     next(new AppError(429, 'Too many attempts, please try again later.'));
//   };
// }
//
// /** Max 5 failed login attempts per IP per window (default 15 minutes). */
// export const loginLimiter = rateLimit({
//   windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MIN * 60_000,
//   limit: env.LOGIN_RATE_LIMIT_MAX,
//   skipSuccessfulRequests: true,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: createRateLimitHandler(),
// });
//
// /** Max 10 signup requests per IP per window (default 60 minutes). */
// export const signupLimiter = rateLimit({
//   windowMs: env.SIGNUP_RATE_LIMIT_WINDOW_MIN * 60_000,
//   limit: env.SIGNUP_RATE_LIMIT_MAX,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: createRateLimitHandler(),
// });
//
// /** General API rate limiter across all /api routes (default 200 requests per 15 minutes). */
// export const apiLimiter = rateLimit({
//   windowMs: env.API_RATE_LIMIT_WINDOW_MIN * 60_000,
//   limit: env.API_RATE_LIMIT_MAX,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: createRateLimitHandler(),
// });
export {};
