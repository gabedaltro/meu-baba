import { apiClient } from '../../services/apiClient'
import type { PlayerPosition, PlayerType } from '../players/playersApi'

export type RankingMetric = 'GOALS' | 'ASSISTS'
export type RankingStatus = 'ACTIVE' | 'INACTIVE' | 'ALL'

export type RankingFilters = {
  metric: RankingMetric
  status: RankingStatus
  type?: PlayerType | null
  search?: string | null
  startDate?: string | null
  endDate?: string | null
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
    status: RankingStatus
    type: PlayerType | null
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
      search: filters.search || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  })

  return response.data
}
