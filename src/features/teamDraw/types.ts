export type DrawParticipantType = 'monthly_player' | 'goalkeeper' | 'guest'

export type DrawMode = 'random' | 'balanced'

export type DrawSpecialGroupingTarget = 'team' | 'group'

export type DrawParticipant = {
  id: number
  name: string
  type: DrawParticipantType
}

export type DrawSpecialGroupingRule = {
  name: string
  aliases?: string[]
  type?: DrawParticipantType
  optional?: boolean
}

export type DrawSpecialGroupingConfig = {
  id: string
  name: string
  enabled: boolean
  target: DrawSpecialGroupingTarget
  rules: DrawSpecialGroupingRule[]
  preferredTeamIndexes?: number[]
}

export type DrawLateArrivalRule = {
  id: string
  name: string
  enabled: boolean
  aliases: string[]
}

export type DrawTeam = {
  id: number
  name: string
  color: 'success' | 'default' | 'primary' | 'secondary'
  players: DrawParticipant[]
  appliedGroupingNames?: string[]
}
