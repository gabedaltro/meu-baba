import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { AdminEventInfo } from '../types'

const statusLabels = {
  open: 'Aberto',
  closed: 'Fechado',
  finished: 'Realizado',
  cancelled: 'Cancelado',
}

type EventInfoCardProps = {
  event: AdminEventInfo
}

export function EventInfoCard({ event }: EventInfoCardProps) {
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(event.startsAt)

  const time = new Intl.DateTimeFormat('pt-BR', {
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
              <Typography variant="h2">{event.title}</Typography>
              <Typography color="text.secondary">Dados principais do próximo baba.</Typography>
            </Box>
            <Chip label={statusLabels[event.status]} color="primary" />
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CalendarMonthOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Data
                </Typography>
                <Typography sx={{ textTransform: 'capitalize' }}>{date}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <AccessTimeOutlinedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Hora
                </Typography>
                <Typography>{time}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
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
