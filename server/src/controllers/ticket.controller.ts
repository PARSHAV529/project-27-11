import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Ticket } from '../models/Ticket.js';
import type { AuthenticatedUser } from '../types/express.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be at most 120 characters'),
  description: z.string().trim().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const listTicketsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const ticketIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ticket ID'),
});

export const addCommentSchema = z.object({
  text: z.string().trim().min(1, 'Comment text is required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

const TICKET_DETAIL_POPULATE = [
  { path: 'createdBy', select: 'name email role' },
  { path: 'assignedTo', select: 'name email role' },
  { path: 'comments.author', select: 'name role' },
];

/** Determine whether a user is allowed to view (and comment on) a ticket. */
export function canViewTicket(user: AuthenticatedUser, ticket: { createdBy: unknown }): boolean {
  if (user.role === 'agent' || user.role === 'admin') {
    return true;
  }

  const ownerId =
    typeof ticket.createdBy === 'object' &&
    ticket.createdBy !== null &&
    '_id' in ticket.createdBy
      ? String((ticket.createdBy as { _id: unknown })._id)
      : String(ticket.createdBy);

  return ownerId === user.id;
}

/** Create a new ticket owned by the authenticated user with status open. */
export const createTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, description, priority } = req.body as z.infer<typeof createTicketSchema>;

  const ticket = await Ticket.create({
    title,
    description,
    priority: priority ?? 'medium',
    status: 'open',
    createdBy: req.user!.id,
  });

  await ticket.populate([
    { path: 'createdBy', select: 'name email role' },
    { path: 'assignedTo', select: 'name email role' },
  ]);

  res.status(201).json(ticket);
});

/** List tickets scoped by role with title search, status/priority filters, and pagination. */
export const getTickets = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { search, status, priority, page, limit } = (res.locals.query ??
    listTicketsQuerySchema.parse(req.query)) as z.infer<typeof listTicketsQuerySchema>;

  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'employee') {
    filter.createdBy = req.user!.id;
  }

  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: 'i' };
  }

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role'),
    Ticket.countDocuments(filter),
  ]);

  res.status(200).json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

/** Fetch a single ticket by ID with populated creator, assignee, and comment authors. */
export const getTicketById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = (res.locals.params ?? ticketIdParamSchema.parse(req.params)) as z.infer<
    typeof ticketIdParamSchema
  >;

  const ticket = await Ticket.findById(id).populate(TICKET_DETAIL_POPULATE);

  if (!ticket || !canViewTicket(req.user!, ticket)) {
    throw new AppError(404, 'Ticket not found');
  }

  res.status(200).json(ticket);
});

/** Append a comment to a ticket for its owner, an agent, or an admin. */
export const addComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = (res.locals.params ?? ticketIdParamSchema.parse(req.params)) as z.infer<
    typeof ticketIdParamSchema
  >;
  const { text } = req.body as z.infer<typeof addCommentSchema>;

  const ticket = await Ticket.findById(id);

  if (!ticket || !canViewTicket(req.user!, ticket)) {
    throw new AppError(404, 'Ticket not found');
  }

  ticket.comments.push({
    text,
    author: new mongoose.Types.ObjectId(req.user!.id),
    createdAt: new Date(),
  });

  await ticket.save();
  await ticket.populate(TICKET_DETAIL_POPULATE);

  res.status(201).json(ticket);
});

/** Delete an open ticket; allowed only for the ticket owner. */
export const deleteTicket = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = (res.locals.params ?? ticketIdParamSchema.parse(req.params)) as z.infer<
    typeof ticketIdParamSchema
  >;

  const ticket = await Ticket.findById(id);

  if (!ticket || !canViewTicket(req.user!, ticket)) {
    throw new AppError(404, 'Ticket not found');
  }

  if (ticket.createdBy.toString() !== req.user!.id) {
    throw new AppError(403, 'Only the ticket owner can delete this ticket');
  }

  if (ticket.status !== 'open') {
    throw new AppError(400, 'Only open tickets can be deleted');
  }

  await ticket.deleteOne();
  res.status(204).send();
});

/** Update ticket status (agent or admin only). */
export const updateTicketStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = (res.locals.params ?? ticketIdParamSchema.parse(req.params)) as z.infer<
    typeof ticketIdParamSchema
  >;
  const { status } = req.body as z.infer<typeof updateStatusSchema>;

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    throw new AppError(404, 'Ticket not found');
  }

  ticket.status = status;
  await ticket.save();
  await ticket.populate(TICKET_DETAIL_POPULATE);

  res.status(200).json(ticket);
});

/** Assign a ticket to the currently authenticated agent or admin. */
export const assignTicketToMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = (res.locals.params ?? ticketIdParamSchema.parse(req.params)) as z.infer<
    typeof ticketIdParamSchema
  >;

  const ticket = await Ticket.findById(id);

  if (!ticket) {
    throw new AppError(404, 'Ticket not found');
  }

  ticket.assignedTo = new mongoose.Types.ObjectId(req.user!.id);
  await ticket.save();
  await ticket.populate(TICKET_DETAIL_POPULATE);

  res.status(200).json(ticket);
});
