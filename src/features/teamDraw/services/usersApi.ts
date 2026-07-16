import { apiClient } from '../../../services/apiClient'
import type { DrawParticipant, DrawParticipantType } from '../types'

export type TeamDrawApiPlayer = {
  id: string | number
  name: string
  nickname?: string | null
  jerseyNumber?: number | null
  photoUrl?: string | null
  position: 'GOALKEEPER' | 'OUTFIELD'
  isActive?: boolean
}

type PlayersResponse = TeamDrawApiPlayer[] | { data: TeamDrawApiPlayer[] }

export function mapPlayerPositionToParticipantType(
  position: TeamDrawApiPlayer['position'],
): DrawParticipantType {
  return position === 'GOALKEEPER' ? 'goalkeeper' : 'monthly_player'
}

export function mapApiPlayerToDrawParticipant(player: TeamDrawApiPlayer): DrawParticipant {
  const playerId = String(player.id)

  return {
    id: playerId,
    userId: playerId,
    name: player.name,
    nickname: player.nickname ?? undefined,
    jerseyNumber: player.jerseyNumber ?? undefined,
    type: mapPlayerPositionToParticipantType(player.position),
    photoUrl: player.photoUrl ?? undefined,
  }
}

export async function fetchTeamDrawPlayers() {
  const response = await apiClient.get<PlayersResponse>('/players')
  const players = Array.isArray(response.data) ? response.data : response.data.data

  return players.filter((player) => player.isActive !== false)
}


