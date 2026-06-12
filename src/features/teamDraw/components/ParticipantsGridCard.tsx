import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { DrawParticipant, DrawParticipantType } from '../types'

const participantTypeLabels: Record<DrawParticipantType, { label: string; color: 'default' | 'primary' | 'secondary' }> = {
  monthly_player: { label: 'Mensalista', color: 'default' },
  goalkeeper: { label: 'Goleiro', color: 'primary' },
  guest: { label: 'Convidado', color: 'secondary' },
}

type ParticipantsGridCardProps = {
  participants: DrawParticipant[]
  onAdd: (name: string, type: DrawParticipantType) => boolean
  onRemove: (participantId: number) => void
  onClear: () => void
  onOpenBulkImport: () => void
}

export function ParticipantsGridCard({
  participants,
  onAdd,
  onRemove,
  onClear,
  onOpenBulkImport,
}: ParticipantsGridCardProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<DrawParticipantType>('monthly_player')

  const addParticipant = () => {
    if (onAdd(name, type)) {
      setName('')
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h2">Jogadores do sorteio</Typography>
              <Typography color="text.secondary">
                Informe os nomes e marque goleiros ou convidados quando necessário.
              </Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<ContentPasteOutlinedIcon />}
                onClick={onOpenBulkImport}
              >
                Colar lista
              </Button>
              <Button
                color="error"
                variant="text"
                onClick={onClear}
                disabled={participants.length === 0}
              >
                Limpar lista
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              label="Nome do jogador"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addParticipant()
                }
              }}
              autoComplete="off"
              fullWidth
            />
            <Select
              value={type}
              onChange={(event) => setType(event.target.value as DrawParticipantType)}
              sx={{ minWidth: { xs: '100%', md: 170 } }}
            >
              <MenuItem value="monthly_player">Mensalista</MenuItem>
              <MenuItem value="goalkeeper">Goleiro</MenuItem>
              <MenuItem value="guest">Convidado</MenuItem>
            </Select>
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={addParticipant}
              sx={{ minWidth: { xs: '100%', md: 130 } }}
            >
              Adicionar
            </Button>
          </Stack>

          {participants.length === 0 ? (
            <Stack
              sx={{
                alignItems: 'center',
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                py: 4,
                px: 2,
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>Nenhum jogador informado</Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                Adicione os nomes acima para liberar o sorteio.
              </Typography>
            </Stack>
          ) : (
            <Stack
              sx={{
                maxHeight: { xs: 360, md: 'none' },
                overflowY: { xs: 'auto', md: 'visible' },
                pr: { xs: 0.5, md: 0 },
              }}
            >
              <Grid container spacing={1.5}>
                {participants.map((participant) => {
                  const participantType = participantTypeLabels[participant.type]

                  return (
                    <Grid key={participant.id} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          p: 1.5,
                          bgcolor: 'background.default',
                          minHeight: 76,
                        }}
                      >
                        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700 }} noWrap>
                            {participant.name}
                          </Typography>
                          <Chip
                            label={participantType.label}
                            color={participantType.color}
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        </Stack>
                        <Tooltip title="Remover jogador">
                          <IconButton
                            color="error"
                            aria-label={`Remover ${participant.name}`}
                            onClick={() => onRemove(participant.id)}
                          >
                            <DeleteOutlineOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                  )
                })}
              </Grid>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
