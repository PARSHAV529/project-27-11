import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/User.js';

export interface AuthJwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Sign an access token containing only user id and role. */
export function signToken(payload: { id: string; role: UserRole }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Verify and decode an access token using the configured JWT_SECRET. */
export function verifyToken(token: string): AuthJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
}
