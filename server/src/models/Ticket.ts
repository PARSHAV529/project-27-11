import mongoose, { type HydratedDocument, Schema, type Types } from 'mongoose';

export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ITicketComment {
  text: string;
  author: Types.ObjectId;
  createdAt: Date;
}

export interface ITicket {
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  comments: ITicketComment[];
  createdAt: Date;
  updatedAt: Date;
}

export type TicketDocument = HydratedDocument<ITicket>;

const commentSchema = new Schema<ITicketComment>(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
