import { Router } from 'express';
import {
  addComment,
  addCommentSchema,
  assignTicketToMe,
  createTicket,
  createTicketSchema,
  deleteTicket,
  getTicketById,
  getTickets,
  listTicketsQuerySchema,
  ticketIdParamSchema,
  updateStatusSchema,
  updateTicketStatus,
} from '../controllers/ticket.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate, validateParams, validateQuery } from '../middleware/validate.js';

const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.post('/', validate(createTicketSchema), createTicket);
ticketRouter.get('/', validateQuery(listTicketsQuerySchema), getTickets);
ticketRouter.get('/:id', validateParams(ticketIdParamSchema), getTicketById);
ticketRouter.post(
  '/:id/comments',
  validateParams(ticketIdParamSchema),
  validate(addCommentSchema),
  addComment,
);
ticketRouter.patch(
  '/:id/status',
  authorize('agent', 'admin'),
  validateParams(ticketIdParamSchema),
  validate(updateStatusSchema),
  updateTicketStatus,
);
ticketRouter.patch(
  '/:id/assign',
  authorize('agent', 'admin'),
  validateParams(ticketIdParamSchema),
  assignTicketToMe,
);
ticketRouter.delete('/:id', validateParams(ticketIdParamSchema), deleteTicket);

export default ticketRouter;
