import type { Request, Response } from 'express';
import { z } from 'zod';
import { User, toSafeUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['employee', 'agent', 'admin']),
});

/** List all users without password fields (admin only). */
export const listUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find().select('name email role').sort({ createdAt: -1 });
  res.status(200).json(users.map(toSafeUser));
});

/** Update another user's role (admin only; admins cannot change their own role). */
export const updateUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = (res.locals.params ?? userIdParamSchema.parse(req.params)) as z.infer<
    typeof userIdParamSchema
  >;
  const { role } = req.body as z.infer<typeof updateUserRoleSchema>;

  if (id === req.user!.id) {
    throw new AppError(400, 'Admins cannot change their own role');
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  user.role = role;
  await user.save();

  res.status(200).json(toSafeUser(user));
});
