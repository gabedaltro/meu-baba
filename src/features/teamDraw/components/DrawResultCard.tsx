import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { DrawParticipant, DrawTeam } from '../types'

function getPlayerBadge(player: DrawParticipant) {
  if (player.type === 'goalkeeper') {
    return <Chip label="GOLEIRO" color="primary" size="small" />
  }

  if (player.type === 'guest') {
    return <Chip label="CONVIDADO" color="secondary" size="small" />
  }

  return null
}

type DrawResultCardProps = {
  teams: DrawTeam[]
  lateParticipants: DrawParticipant[]
  maxPlayersPerTeam: number
  onRedraw: () => void
  onCopy: () => void
  onShare: () => void
  onAssignLateParticipant: (participantId: number) => void
  onChangePlayerStat: (
    participantId: number,
    stat: 'goals' | 'assists',
    delta: number,
  ) => void
}

function getFieldPlayerCount(team: DrawTeam) {
  return team.players.filter((player) => player.type !== 'goalkeeper').length
}

function getSuggestedTeamName(
  teams: DrawTeam[],
  lateParticipant: DrawParticipant,
  maxPlayersPerTeam: number,
) {
  if (teams.length === 0) {
    return null
  }

  if (lateParticipant.type === 'goalkeeper') {
    const teamWithoutGoalkeeper = teams.find(
      (team) => !team.players.some((player) => player.type === 'goalkeeper'),
    )

    return teamWithoutGoalkeeper?.name ?? teams[0].name
  }

  const availableTeams = teams.filter(
    (team) => getFieldPlayerCount(team) < maxPlayersPerTeam,
  )
  const targetTeams = availableTeams.length > 0 ? availableTeams : teams

  return [...targetTeams].sort(
    (firstTeam, secondTeam) =>
      getFieldPlayerCount(firstTeam) - getFieldPlayerCount(secondTeam),
  )[0].name
}

function getPlayerStatsLabel(player: DrawParticipant) {
  return `G ${player.goals ?? 0} · A ${player.assists ?? 0}`
}

type PlayerStatControlsProps = {
  player: DrawParticipant
  compact?: boolean
  onChangePlayerStat: (
    participantId: number,
    stat: 'goals' | 'assists',
    delta: number,
  ) => void
}

function PlayerStatControls({
  player,
  compact = false,
  onChangePlayerStat,
}: PlayerStatControlsProps) {
  const statItems = [
    { key: 'goals' as const, label: 'Gols', shortLabel: 'G', value: player.goals ?? 0 },
    { key: 'assists' as const, label: 'Assistências', shortLabel: 'A', value: player.assists ?? 0 },
  ]

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      {statItems.map((item) => (
        <Stack
          key={item.key}
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: compact ? 'transparent' : 'background.default',
            px: compact ? 0.75 : 1.5,
            py: compact ? 0.5 : 1,
          }}
        >
          <Typography sx={{ minWidth: compact ? 18 : 92, fontWeight: 800 }}>
            {compact ? item.shortLabel : item.label}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Tooltip title={`Remover ${item.label.toLocaleLowerCase('pt-BR')}`}>
              <span>
                <IconButton
                  size={compact ? 'small' : 'medium'}
                  color="primary"
                  disabled={item.value === 0}
                  onClick={() => onChangePlayerStat(player.id, item.key, -1)}
                  aria-label={`Remover ${item.label.toLocaleLowerCase('pt-BR')} de ${player.name}`}
                >
                  <RemoveOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography
              sx={{
                width: compact ? 24 : 36,
                textAlign: 'center',
                fontWeight: 900,
                fontSize: compact ? '1rem' : '1.35rem',
              }}
            >
              {item.value}
            </Typography>
            <Tooltip title={`Adicionar ${item.label.toLocaleLowerCase('pt-BR')}`}>
              <IconButton
                size={compact ? 'small' : 'medium'}
                color="primary"
                onClick={() => onChangePlayerStat(player.id, item.key, 1)}
                aria-label={`Adicionar ${item.label.toLocaleLowerCase('pt-BR')} para ${player.name}`}
              >
                <AddOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

export function DrawResultCard({
  teams,
  lateParticipants,
  maxPlayersPerTeam,
  onRedraw,
  onCopy,
  onShare,
  onAssignLateParticipant,
  onChangePlayerStat,
}: DrawResultCardProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const selectedPlayer = useMemo(
    () =>
      teams
        .flatMap((team) => team.players)
        .find((player) => player.id === selectedPlayerId) ?? null,
    [selectedPlayerId, teams],
  )
  const closeStatsDialog = () => setSelectedPlayerId(null)

  return (
    <Box
      component={motion.section}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      sx={{ scrollMarginTop: 24 }}
    >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h2" sx={{ color: '#ffffff' }}>
                Times em campo
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.72)' }}>
                Toque no jogador para lançar gols e assistências
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshOutlinedIcon />}
                onClick={onRedraw}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.55)',
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255,255,255,0.13)',
                  },
                }}
              >
                Refazer sorteio
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={onCopy}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.55)',
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255,255,255,0.13)',
                  },
                }}
              >
                Copiar times
              </Button>
              <Button
                variant="contained"
                startIcon={<ShareOutlinedIcon />}
                onClick={onShare}
                sx={{
                  bgcolor: '#ffffff',
                  color: 'primary.dark',
                  '&:hover': { bgcolor: '#e9f4ed' },
                }}
              >
                Compartilhar
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            {teams.map((team, teamIndex) => {
              const goalkeeperCount = team.players.filter((player) => player.type === 'goalkeeper').length
              const guestCount = team.players.filter((player) => player.type === 'guest').length
              const fieldPlayerCount = team.players.length - goalkeeperCount
              const teamColor = ['#1f7a4d', '#1976a2', '#c47d16', '#7b4f9d'][teamIndex % 4]

              return (
                <Box
                  component={motion.article}
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: teamIndex * 0.09, duration: 0.4 }}
                  sx={{
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.96)',
                    boxShadow: '0 18px 50px rgba(9, 38, 24, 0.16)',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: 'center', bgcolor: teamColor, color: '#fff', px: 2, py: 1.5 }}
                  >
                    <SportsSoccerOutlinedIcon />
                    <Typography variant="h3" sx={{ color: 'inherit', flex: 1 }}>{team.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.85 }}>
                      {team.players.length} jogadores
                    </Typography>
                  </Stack>
                  <Stack
                    spacing={1.25}
                    sx={{
                      p: 2,
                      height: '100%',
                    }}
                  >
                    <Stack spacing={1}>
                      {team.players.map((player, playerIndex) => (
                        <Stack
                          component={motion.div}
                          key={player.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: teamIndex * 0.09 + playerIndex * 0.045 + 0.15 }}
                          direction="row"
                          spacing={1.25}
                          onClick={() => {
                            if (isMobile) {
                              setSelectedPlayerId(player.id)
                            }
                          }}
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            p: { xs: 1, sm: 0.75 },
                            cursor: { xs: 'pointer', sm: 'default' },
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: `${teamColor}18`, color: teamColor, fontSize: 13, fontWeight: 800 }}>
                              {player.name.charAt(0).toLocaleUpperCase('pt-BR')}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 650 }} noWrap>{player.name}</Typography>
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
                                {getPlayerBadge(player)}
                                <Chip
                                  label={getPlayerStatsLabel(player)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: 10, display: { xs: 'inline-flex', sm: 'none' } }}
                                />
                              </Stack>
                            </Box>
                          </Stack>
                          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <PlayerStatControls
                              player={player}
                              compact
                              onChangePlayerStat={onChangePlayerStat}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            aria-label={`Editar gols e assistências de ${player.name}`}
                            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', pt: 1 }}>
                      <Chip label={`${fieldPlayerCount} de linha`} />
                      <Chip label={`${goalkeeperCount} goleiro${goalkeeperCount === 1 ? '' : 's'}`} color="primary" variant="outlined" />
                      <Chip label={`${guestCount} convidado${guestCount === 1 ? '' : 's'}`} color="secondary" variant="outlined" />
                    </Stack>
                  </Stack>
                </Box>
              )
            })}
          </Box>

          {lateParticipants.length > 0 ? (
            <Box
              component={motion.section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                p: { xs: 1.5, sm: 2 },
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ScheduleOutlinedIcon sx={{ color: '#fff' }} />
                  <Box>
                    <Typography variant="h3" sx={{ color: '#fff' }}>
                      Atrasados para completar
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                      Eles ficaram fora do sorteio inicial. Quando chegarem, encaixe no time sugerido.
                    </Typography>
                  </Box>
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: 1,
                  }}
                >
                  {lateParticipants.map((participant) => {
                    const suggestedTeamName = getSuggestedTeamName(teams, participant, maxPlayersPerTeam)

                    return (
                      <Stack
                        key={participant.id}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{
                          alignItems: { xs: 'stretch', sm: 'center' },
                          justifyContent: 'space-between',
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.94)',
                          p: 1,
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff1d6', color: '#9a5a00', fontSize: 13, fontWeight: 800 }}>
                            {participant.name.charAt(0).toLocaleUpperCase('pt-BR')}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800 }} noWrap>
                              {participant.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sugestão: {suggestedTeamName ?? 'aguardar time'}
                            </Typography>
                          </Box>
                        </Stack>
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => onAssignLateParticipant(participant.id)}
                        >
                          Entrou
                        </Button>
                      </Stack>
                    )
                  })}
                </Box>
              </Stack>
            </Box>
          ) : null}
        </Stack>
        <Dialog
          open={Boolean(selectedPlayer)}
          onClose={closeStatsDialog}
          fullWidth
          maxWidth="xs"
          slotProps={{
            paper: {
              sx: {
                m: 1.5,
                borderRadius: 2,
              },
            },
          }}
        >
          {selectedPlayer ? (
            <>
              <DialogTitle>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    {selectedPlayer.name.charAt(0).toLocaleUpperCase('pt-BR')}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h3" noWrap>
                      {selectedPlayer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Atualizar gols e assistências
                    </Typography>
                  </Box>
                </Stack>
              </DialogTitle>
              <Divider />
              <DialogContent>
                <PlayerStatControls
                  player={selectedPlayer}
                  onChangePlayerStat={onChangePlayerStat}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button variant="contained" onClick={closeStatsDialog} fullWidth>
                  Concluir
                </Button>
              </DialogActions>
            </>
          ) : null}
        </Dialog>
    </Box>
  )
}
