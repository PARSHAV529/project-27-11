import type { Role } from '@/types/auth'

export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface TicketUserSummary {
  _id: string
  name: string
  email: string
  role: Role
}

export interface TicketCommentAuthor {
  _id: string
  name: string
  role: Role
}

export interface TicketComment {
  _id: string
  text: string
  author: string | TicketCommentAuthor
  createdAt: string
}

export interface Ticket {
  _id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  createdBy: TicketUserSummary
  assignedTo: TicketUserSummary | null
  comments: TicketComment[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedTicketsResponse {
  data: Ticket[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GetTicketsParams {
  search?: string
  status?: TicketStatus
  priority?: TicketPriority
  page?: number
  limit?: number
}

export interface CreateTicketPayload {
  title: string
  description: string
  priority?: TicketPriority
}
