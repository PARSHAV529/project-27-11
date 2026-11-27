import { api } from '@/api/axios'
import type { Role, User } from '@/types/auth'

export interface PaginatedUsersResponse {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GetUsersParams {
  search?: string
  page?: number
  limit?: number
}

export async function getUsers(
  params: GetUsersParams = {},
  signal?: AbortSignal,
): Promise<PaginatedUsersResponse> {
  const cleanParams: Record<string, string | number> = {}

  if (params.search?.trim()) {
    cleanParams.search = params.search.trim()
  }
  if (params.page) {
    cleanParams.page = params.page
  }
  if (params.limit) {
    cleanParams.limit = params.limit
  }

  const { data } = await api.get<PaginatedUsersResponse>('/users', {
    params: cleanParams,
    signal,
  })
  return data
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}/role`, { role })
  return data
}
