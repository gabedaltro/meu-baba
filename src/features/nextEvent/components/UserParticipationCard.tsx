import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { UserParticipation } from '../types'

const participationStatus = {
  confirmed: {
    label: 'Confirmado',
    color: 'success' as const,
    icon: <CheckCircleOutlineOutlinedIcon />,
  },
  absent: {
    label: 'Ausente',
    color: 'warning' as const,
    icon: <HighlightOffOutlinedIcon />,
  },
  pending: {
    label: 'Ainda não respondeu',
    color: 'default' as const,
    icon: <HelpOutlineOutlinedIcon />,
  },
}

type UserParticipationCardProps = {
  participation: UserParticipation
  onConfirm: () => void
  onOpenAbsenceDialog: () => void
}

export function UserParticipationCard({
  participation,
  onConfirm,
  onOpenAbsenceDialog,
}: UserParticipationCardProps) {
  const status = participationStatus[participation.status]
  const respondedAt = participation.respondedAt
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(participation.respondedAt)
    : null

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Box>
              <Typography variant="h2">Sua participação</Typography>
              <Typography color="text.secondary">Informe se você vai jogar este baba.</Typography>
            </Box>
            <Chip icon={status.icon} label={status.label} color={status.color} />
          </Stack>

          {respondedAt ? (
            <Typography color="text.secondary">Resposta registrada em {respondedAt}.</Typography>
          ) : (
            <Typography color="text.secondary">Você ainda não respondeu este evento.</Typography>
          )}

          {participation.absenceReason ? (
            <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Justificativa
              </Typography>
              <Typography>{participation.absenceReason}</Typography>
            </Box>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              onClick={onConfirm}
              fullWidth
            >
              Confirmar presença
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<HighlightOffOutlinedIcon />}
              onClick={onOpenAbsenceDialog}
              fullWidth
            >
              Não vou
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
