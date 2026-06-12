import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { NewEventFormValues } from '../types'

type SummaryLineProps = {
  icon: ReactNode
  label: string
}

function SummaryLine({ icon, label }: SummaryLineProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      {icon}
      <Typography>{label}</Typography>
    </Stack>
  )
}

type EventSummaryPreviewCardProps = {
  values: NewEventFormValues
}

export function EventSummaryPreviewCard({ values }: EventSummaryPreviewCardProps) {
  const formattedDate = values.date
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${values.date}T00:00:00`))
    : 'Selecione uma data'

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h2">Resumo do evento</Typography>
            <Typography color="text.secondary">Atualizado em tempo real.</Typography>
          </Box>

          <Stack spacing={1.75}>
            <SummaryLine icon={<LocationOnOutlinedIcon color="primary" />} label={values.location || 'Local não informado'} />
            <SummaryLine icon={<CalendarMonthOutlinedIcon color="primary" />} label={formattedDate} />
            <SummaryLine icon={<AccessTimeOutlinedIcon color="primary" />} label={values.time || 'Hora não informada'} />
            <SummaryLine
              icon={<GroupsOutlinedIcon color="primary" />}
              label={`Máximo de participantes: ${values.maxParticipants}`}
            />
            <SummaryLine
              icon={<GroupsOutlinedIcon color="success" />}
              label={`Mínimo de mensalistas: ${values.minimumMonthlyPlayersForGuests}`}
            />
            <SummaryLine
              icon={<ConfirmationNumberOutlinedIcon color="secondary" />}
              label={`Convidados liberados: ${values.guestReleaseHoursBefore}h antes`}
            />
            <SummaryLine
              icon={<WarningAmberOutlinedIcon color="warning" />}
              label={`Cancelamento tardio: ${values.lateCancellationHoursBefore}h antes`}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
