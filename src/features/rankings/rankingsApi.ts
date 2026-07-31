import { apiClient } from '../../services/apiClient'
import type { PlayerPosition, PlayerType } from '../players/playersApi'

export type RankingMetric = 'GOALS' | 'ASSISTS'
export type RankingStatus = 'ACTIVE' | 'INACTIVE' | 'ALL'

export type RankingFilters = {
  metric: RankingMetric
  limit?: number | null
  status: RankingStatus
  position?: PlayerPosition | null
  type?: PlayerType | null
  search?: string | null
  includeZero: boolean
}

export type RankingPlayer = {
  rank: number
  id: string
  name: string
  nickname: string | null
  jerseyNumber: number | null
  photoUrl: string | null
  position: PlayerPosition
  type: PlayerType | null
  goals: number
  assists: number
  isActive: boolean
}

export type RankingResponse = {
  metric: RankingMetric
  total: number
  filters: {
    limit?: number | null
    status: RankingStatus
    position: PlayerPosition | null
    type: PlayerType | null
    search: string | null
    includeZero: boolean
  }
  ranking: RankingPlayer[]
}

export async function fetchPlayerRankings(filters: RankingFilters) {
  const response = await apiClient.get<RankingResponse>('/players/rankings', {
    skipAuth: true,
    params: {
      metric: filters.metric,
      limit: filters.limit || undefined,
      status: filters.status,
      position: filters.position || undefined,
      type: filters.type || undefined,
      search: filters.search || undefined,
      includeZero: filters.includeZero || undefined,
    },
  })

  return response.data
}
