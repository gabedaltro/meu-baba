import { apiClient } from '../../services/apiClient'

export type PlayerPosition = 'GOALKEEPER' | 'OUTFIELD'
export type PlayerType = 'MEMBER' | 'GUEST'
export type JerseySize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

export type Player = {
  id: string | number
  name: string
  nickname?: string | null
  jerseyNumber?: number | null
  jerseySize?: JerseySize | null
  photoUrl?: string | null
  position: PlayerPosition
  type?: PlayerType | null
  goals: number
  assists: number
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
  type?: PlayerType | null
}

export type PlayerStatsPayload = {
  goals?: number
  assists?: number
}

type PlayersResponse = Player[] | { data: Player[] }

function unwrapPlayersResponse(response: PlayersResponse) {
  return Array.isArray(response) ? response : response.data
}

function getPlayerTypeOrder(player: Player) {
  if (player.position === 'GOALKEEPER') {
    return 0
  }

  return player.type === 'GUEST' ? 2 : 1
}

function sortPlayers(players: Player[]) {
  return [...players].sort((firstPlayer, secondPlayer) => {
    if (firstPlayer.isActive !== secondPlayer.isActive) {
      return firstPlayer.isActive ? -1 : 1
    }

    const typeOrderDiff = getPlayerTypeOrder(firstPlayer) - getPlayerTypeOrder(secondPlayer)

    if (typeOrderDiff !== 0) {
      return typeOrderDiff
    }

    return firstPlayer.name.localeCompare(secondPlayer.name, 'pt-BR')
  })
}

export async function fetchPlayers() {
  const response = await apiClient.get<PlayersResponse>('/players')

  return sortPlayers(unwrapPlayersResponse(response.data))
}

export async function createPlayer(payload: PlayerPayload) {
  const response = await apiClient.post<Player>('/players', payload)

  return response.data
}

export async function updatePlayer(playerId: string | number, payload: Partial<PlayerPayload>) {
  const response = await apiClient.patch<Player>(`/players/${playerId}`, payload)

  return response.data
}

export async function updatePlayerStats(
  playerId: string | number,
  payload: PlayerStatsPayload,
) {
  const response = await apiClient.patch<Player>(`/players/${playerId}/stats`, payload)

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
