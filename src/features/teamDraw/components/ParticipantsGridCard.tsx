import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { motion } from 'framer-motion'
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
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        bgcolor: 'rgba(255,255,255,0.92)',
        boxShadow: '0 18px 50px rgba(17, 54, 35, 0.08)',
      }}
    >
        <Stack spacing={2.5} sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h2">Quem vai jogar?</Typography>
              <Typography color="text.secondary">{participants.length} na lista</Typography>
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
                maxHeight: { xs: 350, md: 480 },
                overflowY: 'auto',
                pr: { xs: 0.5, md: 0 },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    xl: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1,
                }}
              >
                {participants.map((participant) => {
                  const participantType = participantTypeLabels[participant.type]

                  return (
                    <motion.div
                      key={participant.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'center',
                          border: '1px solid rgba(31, 122, 77, 0.14)',
                          borderRadius: 2,
                          px: 1,
                          py: 0.75,
                          bgcolor: '#f7faf8',
                          minHeight: 58,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: 14,
                            fontWeight: 800,
                            bgcolor: participant.type === 'goalkeeper' ? 'primary.main' : '#dfece4',
                            color: participant.type === 'goalkeeper' ? 'primary.contrastText' : 'primary.dark',
                          }}
                        >
                          {participant.name.charAt(0).toLocaleUpperCase('pt-BR')}
                        </Avatar>
                        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {participant.name}
                          </Typography>
                          <Chip
                            label={participantType.label}
                            color={participantType.color}
                            size="small"
                            sx={{ alignSelf: 'flex-start', height: 19, fontSize: 10 }}
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
                    </motion.div>
                  )
                })}
              </Box>
            </Stack>
          )}
        </Stack>
    </Paper>
  )
}
