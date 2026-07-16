import { apiClient } from '../../services/apiClient'

export type PlayerPosition = 'GOALKEEPER' | 'OUTFIELD'
export type JerseySize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export type Player = {
  id: string | number
  name: string
  nickname?: string | null
  jerseyNumber?: number | null
  jerseySize?: JerseySize | null
  photoUrl?: string | null
  position: PlayerPosition
  isActive: boolean
  deactivatedAt?: string | null
}

export type PlayerPayload = {
  name: string
  nickname?: string | null
  jerseyNumber?: number | null
  jerseySize?: JerseySize | null
  photoUrl?: string | null
  position: PlayerPosition
}

type PlayersResponse = Player[] | { data: Player[] }

function unwrapPlayersResponse(response: PlayersResponse) {
  return Array.isArray(response) ? response : response.data
}

export async function fetchPlayers() {
  const response = await apiClient.get<PlayersResponse>('/players')

  return unwrapPlayersResponse(response.data)
}

export async function createPlayer(payload: PlayerPayload) {
  const response = await apiClient.post<Player>('/players', payload)

  return response.data
}

export async function updatePlayer(playerId: string | number, payload: Partial<PlayerPayload>) {
  const response = await apiClient.patch<Player>(`/players/${playerId}`, payload)

  return response.data
}

export async function deactivatePlayer(playerId: string | number) {
  const response = await apiClient.patch<Player>(`/players/${playerId}/deactivate`)

  return response.data
}

export async function activatePlayer(playerId: string | number) {
  const response = await apiClient.patch<Player>(`/players/${playerId}/activate`)

  return response.data
}

