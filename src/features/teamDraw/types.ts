export type DrawParticipantType = 'monthly_player' | 'goalkeeper' | 'guest'

export type DrawMode = 'random' | 'balanced'

export type DrawParticipant = {
  id: number
  name: string
  type: DrawParticipantType
}

export type DrawTeam = {
  id: number
  name: string
  color: 'success' | 'default' | 'primary' | 'secondary'
  players: DrawParticipant[]
}
