import type { Request, Response } from 'express';
import { z } from 'zod';
import { User, toSafeUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['employee', 'agent', 'admin']),
});

/** List users with optional search (name or email) and pagination (admin only). */
export const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { search, page, limit } = (res.locals.query ??
    listUsersQuerySchema.parse(req.query)) as z.infer<typeof listUsersQuerySchema>;

  const filter: Record<string, unknown> = {};

  if (search) {
    const regex = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).select('name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    data: users.map(toSafeUser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
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
