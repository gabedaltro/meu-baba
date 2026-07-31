import { apiClient } from '../../services/apiClient'
import type { UserRole } from '../auth/authApi'

export type User = {
  id: string | number
  name: string
  username: string
  role: UserRole
}

export type CreateUserPayload = {
  name: string
  username: string
  password: string
  role: UserRole
}

export type UpdateUserPayload = Partial<{
  name: string
  username: string
  password: string
  role: UserRole
}>

type UsersResponse = User[] | { data: User[] }

function unwrapUsersResponse(response: UsersResponse) {
  return Array.isArray(response) ? response : response.data
}

export async function fetchUsers() {
  const response = await apiClient.get<UsersResponse>('/users')

  return unwrapUsersResponse(response.data)
}

export async function createUser(payload: CreateUserPayload) {
  const response = await apiClient.post<User>('/users', payload)

  return response.data
}

export async function updateUser(userId: string | number, payload: UpdateUserPayload) {
  const response = await apiClient.patch<User>(`/users/${userId}`, payload)

  return response.data
}
