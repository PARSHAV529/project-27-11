import { api } from '@/api/axios'
import type {
  CreateTicketPayload,
  GetTicketsParams,
  PaginatedTicketsResponse,
  Ticket,
  TicketStatus,
} from '@/types/ticket'

export async function getTickets(
  params: GetTicketsParams = {},
  signal?: AbortSignal,
): Promise<PaginatedTicketsResponse> {
  const cleanParams: Record<string, string | number> = {}

  if (params.search?.trim()) {
    cleanParams.search = params.search.trim()
  }
  if (params.status) {
    cleanParams.status = params.status
  }
  if (params.priority) {
    cleanParams.priority = params.priority
  }
  if (params.page) {
    cleanParams.page = params.page
  }
  if (params.limit) {
    cleanParams.limit = params.limit
  }

  const { data } = await api.get<PaginatedTicketsResponse>('/tickets', {
    params: cleanParams,
    signal,
  })
  return data
}

export async function createTicket(body: CreateTicketPayload): Promise<Ticket> {
  const { data } = await api.post<Ticket>('/tickets', body)
  return data
}

export async function getTicket(id: string, signal?: AbortSignal): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`/tickets/${id}`, { signal })
  return data
}

export async function addComment(id: string, text: string): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/comments`, { text })
  return data
}

export async function deleteTicket(id: string): Promise<void> {
  await api.delete(`/tickets/${id}`)
}

export async function updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/${id}/status`, { status })
  return data
}

export async function assignToMe(id: string): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/${id}/assign`)
  return data
}
