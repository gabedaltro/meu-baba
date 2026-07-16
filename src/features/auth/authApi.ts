import { apiClient } from '../../services/apiClient'

export type LoginPayload = {
  username: string
  password: string
}

type LoginResponse = {
  accessToken: string
}

export async function login(payload: LoginPayload) {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)

  return response.data
}

