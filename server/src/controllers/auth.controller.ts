import type { Request, Response } from 'express';
import { z } from 'zod';
import { User, toSafeUser } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** Register a new user, always assigning the default employee role. */
export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as z.infer<typeof signupSchema>;

  const user = await User.create({
    name,
    email,
    password,
    role: 'employee',
  });

  const token = signToken({ id: user._id.toString(), role: user.role });

  res.status(201).json({
    token,
    user: toSafeUser(user),
  });
});

/** Authenticate an existing user and return a signed JWT. */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({ id: user._id.toString(), role: user.role });

  res.status(200).json({
    token,
    user: toSafeUser(user),
  });
});

/** Return the currently authenticated user. */
export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    user: req.user,
  });
});
