import { api } from '@/api/axios'
import type { AuthResponse, LoginPayload, SignupPayload, User } from '@/types/auth'

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/signup', payload)
    return data
  },

  async getMe(): Promise<{ user: User }> {
    const { data } = await api.get<{ user: User }>('/auth/me')
    return data
  },
}
