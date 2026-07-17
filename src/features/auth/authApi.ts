import { apiClient } from '../../services/apiClient'

export type UserRole = 'ADMIN' | 'USER'

export type AuthUser = {
  id: string | number
  name: string
  username: string
  role: UserRole
}

export type LoginPayload = {
  username: string
  password: string
}

type LoginResponse = {
  accessToken: string
  user: AuthUser
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)

  return response.data
}
