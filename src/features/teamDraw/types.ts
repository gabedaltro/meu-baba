export type DrawParticipantType = 'monthly_player' | 'goalkeeper' | 'guest'

export type DrawMode = 'random' | 'balanced'

export type DrawParticipant = {
  id: string
  name: string
  type: DrawParticipantType
  userId?: string
  nickname?: string
  jerseyNumber?: number
  photoUrl?: string
  isLateArrival?: boolean
}

export type DrawTeam = {
  id: number
  name: string
  color: 'success' | 'default' | 'primary' | 'secondary'
  players: DrawParticipant[]
}


