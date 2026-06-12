import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import { Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
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
  onRedraw: () => void
  onCopy: () => void
  onShare: () => void
}

export function DrawResultCard({ teams, onRedraw, onCopy, onShare }: DrawResultCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h2">Resultado do sorteio</Typography>
              <Typography color="text.secondary">Confira a distribuição antes de enviar para o grupo.</Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} onClick={onRedraw}>
                Refazer sorteio
              </Button>
              <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={onCopy}>
                Copiar times
              </Button>
              <Button variant="contained" startIcon={<ShareOutlinedIcon />} onClick={onShare}>
                Compartilhar
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {teams.map((team) => {
              const goalkeeperCount = team.players.filter((player) => player.type === 'goalkeeper').length
              const guestCount = team.players.filter((player) => player.type === 'guest').length
              const fieldPlayerCount = team.players.length - goalkeeperCount

              return (
                <Grid key={team.id} size={{ xs: 12, lg: 6 }}>
                  <Stack
                    spacing={2}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                      bgcolor: 'background.default',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h2">{team.name}</Typography>

                    <Stack spacing={1}>
                      {team.players.map((player) => (
                        <Stack
                          key={player.id}
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Typography>{player.name}</Typography>
                          {getPlayerBadge(player)}
                        </Stack>
                      ))}
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', pt: 1 }}>
                      <Chip label={`${fieldPlayerCount} jogadores de linha`} />
                      <Chip label={`${goalkeeperCount} goleiro${goalkeeperCount === 1 ? '' : 's'}`} color="primary" variant="outlined" />
                      <Chip label={`${guestCount} convidado${guestCount === 1 ? '' : 's'}`} color="secondary" variant="outlined" />
                    </Stack>
                  </Stack>
                </Grid>
              )
            })}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  )
}
