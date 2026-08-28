import { apiClient } from '../../services/apiClient'
import type { PlayerPosition, PlayerType } from '../players/playersApi'

export type MatchDaySource = 'MANUAL' | 'DRAW'

export type MatchDaySummary = {
  id: string
  date: string
  source: MatchDaySource
  capaTeamId: string | null
  teamCount: number
  confrontoCount: number
}

export type MatchDayListResponse = {
  total: number
  hasMore: boolean
  matchDays: MatchDaySummary[]
}

export type MatchDayListFilters = {
  startDate?: string | null
  endDate?: string | null
  offset?: number
  limit?: number
}

export type MatchDayPlayer = {
  id: string
  playerId: string | null
  name: string
  nickname: string | null
  jerseyNumber: number | null
  photoUrl: string | null
  position: PlayerPosition
  type: PlayerType | null
}

export type MatchDayTeam = {
  id: string
  name: string
  teamOrder: number
  players: MatchDayPlayer[]
}

export type ConfrontoPlayerStat = {
  playerId: string
  goals: number
  assists: number
}

export type MatchDayConfronto = {
  id: string
  sequence: number
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
  playerStats: ConfrontoPlayerStat[]
}

export type MatchDayDetail = {
  id: string
  date: string
  source: MatchDaySource
  sourceDrawId: string | null
  capaTeamId: string | null
  createdAt: string
  teams: MatchDayTeam[]
  confrontos: MatchDayConfronto[]
}

export type MatchDayTeamPlayerInput =
  | { playerId: string }
  | { name: string; type: 'GUEST' }

export type MatchDayTeamInput = {
  name: string
  players: MatchDayTeamPlayerInput[]
}

export type CreateMatchDayPayload = {
  date: string
  maxOutfieldPlayersPerTeam: number
  teams: MatchDayTeamInput[]
}

export type SaveDrawAsMatchDayPayload = {
  date: string
}

export type CreateConfrontoPayload = {
  teamAId: string
  teamBId: string
  scoreA: number
  scoreB: number
}

export type UpdateConfrontoPayload = Partial<CreateConfrontoPayload>

export type PlayerStatInput = {
  playerId: string
  goals?: number
  assists?: number
}

export async function fetchMatchDays(filters?: MatchDayListFilters) {
  const response = await apiClient.get<MatchDayListResponse>('/match-days', {
    skipAuth: true,
    params: {
      startDate: filters?.startDate || undefined,
      endDate: filters?.endDate || undefined,
      offset: filters?.offset || undefined,
      limit: filters?.limit || undefined,
    },
  })

  return response.data
}

export async function fetchMatchDay(matchDayId: string) {
  const response = await apiClient.get<MatchDayDetail>(
    `/match-days/${matchDayId}`,
    { skipAuth: true },
  )

  return response.data
}

export async function createMatchDay(payload: CreateMatchDayPayload) {
  const response = await apiClient.post<MatchDayDetail>(
    '/match-days',
    payload,
  )

  return response.data
}

export async function saveDrawAsMatchDay(
  drawId: string,
  payload: SaveDrawAsMatchDayPayload,
) {
  const response = await apiClient.post<MatchDayDetail>(
    `/draws/${drawId}/match-days`,
    payload,
  )

  return response.data
}

export async function createConfronto(
  matchDayId: string,
  payload: CreateConfrontoPayload,
) {
  const response = await apiClient.post<MatchDayConfronto>(
    `/match-days/${matchDayId}/confrontos`,
    payload,
  )

  return response.data
}

export async function updateConfronto(
  confrontoId: string,
  payload: UpdateConfrontoPayload,
) {
  const response = await apiClient.patch<MatchDayConfronto>(
    `/match-day-confrontos/${confrontoId}`,
    payload,
  )

  return response.data
}

export async function deleteConfronto(confrontoId: string) {
  await apiClient.delete(`/match-day-confrontos/${confrontoId}`)
}

export async function setConfrontoPlayerStats(
  confrontoId: string,
  stats: PlayerStatInput[],
) {
  const response = await apiClient.put<ConfrontoPlayerStat[]>(
    `/match-day-confrontos/${confrontoId}/player-stats`,
    { stats },
  )

  return response.data
}

export async function setMatchDayCapa(matchDayId: string, teamId: string) {
  const response = await apiClient.patch<MatchDayDetail>(
    `/match-days/${matchDayId}/capa`,
    { teamId },
  )

  return response.data
}
