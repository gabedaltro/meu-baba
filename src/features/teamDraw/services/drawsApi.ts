import { apiClient } from '../../../services/apiClient'
import type { DrawParticipant, DrawParticipantType, DrawTeam } from '../types'
import {
  mapApiPlayerToDrawParticipant,
  mapApiPlayerToParticipantType,
  type TeamDrawApiPlayer,
} from './usersApi'

type ApiDrawParticipantType = 'MEMBER' | 'GUEST' | null

type CreateDrawParticipantPayload = {
  playerId?: string
  name?: string
  type: ApiDrawParticipantType | 'GUEST'
  isLateArrival: boolean
}

type CreateDrawPayload = {
  eventId: string
  maxOutfieldPlayersPerTeam: number
  participants: CreateDrawParticipantPayload[]
}

type ApiDrawTeamPlayer = {
  id?: string | number
  playerId?: string | number | null
  name?: string | null
  guestName?: string | null
  type?: ApiDrawParticipantType
  position?: 'GOALKEEPER' | 'OUTFIELD' | null
  isLateArrival?: boolean | null
  player?: TeamDrawApiPlayer | null
  jerseyNumber?: number | null
  photoUrl?: string | null
  nickname?: string | null
}

type ApiDrawTeam = {
  id?: string | number
  name?: string | null
  order?: number | null
  position?: number | null
  players?: ApiDrawTeamPlayer[]
  participants?: ApiDrawTeamPlayer[]
  drawTeamPlayers?: ApiDrawTeamPlayer[]
}

type ApiDrawResponse = {
  id?: string | number
  teams?: ApiDrawTeam[]
  drawTeams?: ApiDrawTeam[]
  data?: {
    teams?: ApiDrawTeam[]
    drawTeams?: ApiDrawTeam[]
  }
}

const teamColors: DrawTeam['color'][] = [
  'success',
  'default',
  'primary',
  'secondary',
]

function mapParticipantTypeToApiType(
  participant: DrawParticipant,
): ApiDrawParticipantType {
  if (participant.type === 'goalkeeper') {
    return null
  }

  return participant.type === 'guest' ? 'GUEST' : 'MEMBER'
}

function getApiTeams(response: ApiDrawResponse) {
  return (
    response.teams ??
    response.drawTeams ??
    response.data?.teams ??
    response.data?.drawTeams ??
    []
  )
}

function getApiTeamPlayers(team: ApiDrawTeam) {
  return team.players ?? team.participants ?? team.drawTeamPlayers ?? []
}

function getDrawTeamId(team: ApiDrawTeam, fallbackId: number) {
  const numericId = Number(team.id ?? fallbackId)

  return Number.isFinite(numericId) ? numericId : fallbackId
}

function getPlayerId(apiPlayer: ApiDrawTeamPlayer) {
  const playerId = apiPlayer.playerId ?? apiPlayer.player?.id

  return playerId === undefined || playerId === null ? undefined : String(playerId)
}

function getParticipantType(
  apiPlayer: ApiDrawTeamPlayer,
  sourceParticipant?: DrawParticipant,
): DrawParticipantType {
  if (sourceParticipant) {
    return sourceParticipant.type
  }

  if (apiPlayer.player) {
    return mapApiPlayerToParticipantType(apiPlayer.player)
  }

  if (apiPlayer.position === 'GOALKEEPER') {
    return 'goalkeeper'
  }

  return apiPlayer.type === 'GUEST' ? 'guest' : 'monthly_player'
}

function mapApiTeamPlayerToDrawParticipant(
  apiPlayer: ApiDrawTeamPlayer,
  teamIndex: number,
  playerIndex: number,
  participantLookup: Map<string, DrawParticipant>,
): DrawParticipant {
  const playerId = getPlayerId(apiPlayer)
  const sourceParticipant = playerId ? participantLookup.get(playerId) : undefined

  if (apiPlayer.player) {
    const mappedPlayer = mapApiPlayerToDrawParticipant(apiPlayer.player)

    return {
      ...mappedPlayer,
      isLateArrival: apiPlayer.isLateArrival ?? sourceParticipant?.isLateArrival,
    }
  }

  return {
    id:
      playerId ??
      String(apiPlayer.id ?? `draw-player-${teamIndex + 1}-${playerIndex + 1}`),
    userId: playerId ?? sourceParticipant?.userId,
    name:
      apiPlayer.name ??
      apiPlayer.guestName ??
      sourceParticipant?.name ??
      `Jogador ${playerIndex + 1}`,
    nickname: apiPlayer.nickname ?? sourceParticipant?.nickname,
    jerseyNumber: apiPlayer.jerseyNumber ?? sourceParticipant?.jerseyNumber,
    photoUrl: apiPlayer.photoUrl ?? sourceParticipant?.photoUrl,
    type: getParticipantType(apiPlayer, sourceParticipant),
    isLateArrival: apiPlayer.isLateArrival ?? sourceParticipant?.isLateArrival,
  }
}

function mapApiDrawToTeams(
  response: ApiDrawResponse,
  sourceParticipants: DrawParticipant[],
): DrawTeam[] {
  const participantLookup = new Map(
    sourceParticipants.map((participant) => [String(participant.id), participant]),
  )

  return getApiTeams(response).map((team, teamIndex) => {
    const teamNumber = team.order ?? team.position ?? teamIndex + 1

    return {
      id: getDrawTeamId(team, teamNumber),
      name: team.name ?? `Time ${teamNumber}`,
      color: teamColors[teamIndex % teamColors.length] ?? 'default',
      players: getApiTeamPlayers(team).map((player, playerIndex) =>
        mapApiTeamPlayerToDrawParticipant(
          player,
          teamIndex,
          playerIndex,
          participantLookup,
        ),
      ),
    }
  })
}

export async function createTeamDraw({
  eventId,
  maxOutfieldPlayersPerTeam,
  participants,
}: {
  eventId: string
  maxOutfieldPlayersPerTeam: number
  participants: DrawParticipant[]
}) {
  const payload: CreateDrawPayload = {
    eventId,
    maxOutfieldPlayersPerTeam,
    participants: participants.map((participant) => {
      if (participant.userId) {
        return {
          playerId: participant.userId,
          type: mapParticipantTypeToApiType(participant),
          isLateArrival: Boolean(participant.isLateArrival),
        }
      }

      return {
        name: participant.name,
        type: 'GUEST',
        isLateArrival: Boolean(participant.isLateArrival),
      }
    }),
  }

  const response = await apiClient.post<ApiDrawResponse>('/draws', payload)

  return mapApiDrawToTeams(response.data, participants)
}
