import { apiClient } from '../../services/apiClient'
import type { PlayerPosition, PlayerType } from '../players/playersApi'

export type RankingMetric = 'GOALS' | 'ASSISTS' | 'CAPAS'
export type RankingStatus = 'ACTIVE' | 'INACTIVE' | 'ALL'

export type RankingFilters = {
  metric: RankingMetric
  status: RankingStatus
  type?: PlayerType | null
  excludeGuests?: boolean
  search?: string | null
  startDate?: string | null
  endDate?: string | null
  offset?: number
  limit?: number
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
  capas: number
  isActive: boolean
}

export type RankingResponse = {
  metric: RankingMetric
  total: number
  hasMore: boolean
  filters: {
    limit: number
    offset: number
    status: RankingStatus
    type: PlayerType | null
    excludeGuests?: boolean
    search: string | null
    startDate: string | null
    endDate: string | null
  }
  ranking: RankingPlayer[]
}

export async function fetchPlayerRankings(filters: RankingFilters) {
  const response = await apiClient.get<RankingResponse>('/players/rankings', {
    skipAuth: true,
    params: {
      metric: filters.metric,
      status: filters.status,
      type: filters.type || undefined,
      excludeGuests: filters.excludeGuests || undefined,
      search: filters.search || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      offset: filters.offset || undefined,
      limit: filters.limit || undefined,
    },
  })

  return response.data
}
