import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { NextEvent } from '../types'

const eventStatusLabel = {
  open: 'Aberto',
  closed: 'Fechado',
  finished: 'Realizado',
  cancelled: 'Cancelado',
}

type EventSummaryCardProps = {
  event: NextEvent
}

export function EventSummaryCard({ event }: EventSummaryCardProps) {
  const eventDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(event.startsAt)

  const eventTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(event.startsAt)

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Box>
              <Typography variant="h2">Próximo evento</Typography>
              <Typography color="text.secondary">Confirme sua presença no próximo baba.</Typography>
            </Box>
            <Chip label={eventStatusLabel[event.status]} color="primary" />
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <CalendarMonthOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Data
                </Typography>
                <Typography sx={{ textTransform: 'capitalize' }}>{eventDate}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <AccessTimeOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Hora
                </Typography>
                <Typography>{eventTime}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <LocationOnOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Local
                </Typography>
                <Typography>{event.location}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
