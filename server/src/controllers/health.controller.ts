import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/** Return API and MongoDB connection health status. */
export function getHealth(_req: Request, res: Response): void {
  const readyState = mongoose.connection.readyState;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: 'ok',
        environment: env.NODE_ENV,
        uptimeSeconds: Math.round(process.uptime()),
        database: DB_STATES[readyState] ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
      'Server is healthy',
    ),
  );
}
