import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import { Alert, Box, Card, CardContent, Grid, LinearProgress, Snackbar, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { AdminTabsCard } from '../features/eventAdmin/components/AdminTabsCard'
import { EventInfoCard } from '../features/eventAdmin/components/EventInfoCard'
import { QuickActionsCard } from '../features/eventAdmin/components/QuickActionsCard'
import type { AbsentParticipant, AdminEventInfo, AdminGuest, ConfirmedParticipant } from '../features/eventAdmin/types'
import { EventMetricCard } from '../features/nextEvent/components/EventMetricCard'

const eventMock: AdminEventInfo = {
  id: 1,
  title: 'Baba Champion Multi Arena',
  startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  location: 'Champion Multi Arena',
  status: 'open',
  maxParticipants: 24,
}

const confirmedParticipantsMock: ConfirmedParticipant[] = [
  { id: 1, name: 'Gabriel Santos', confirmedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), type: 'monthly_player', status: 'confirmed' },
  { id: 2, name: 'Rafael Moura', confirmedAt: new Date(Date.now() - 22 * 60 * 60 * 1000), type: 'goalkeeper', status: 'confirmed' },
  { id: 3, name: 'Lucas Almeida', confirmedAt: new Date(Date.now() - 19 * 60 * 60 * 1000), type: 'monthly_player', status: 'confirmed' },
  { id: 4, name: 'André Costa', confirmedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), type: 'goalkeeper', status: 'present' },
  { id: 5, name: 'Thiago Ramos', confirmedAt: new Date(Date.now() - 9 * 60 * 60 * 1000), type: 'monthly_player', status: 'confirmed' },
  { id: 6, name: 'Felipe Rocha', confirmedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), type: 'monthly_player', status: 'confirmed' },
]

const absentParticipantsMock: AbsentParticipant[] = [
  {
    id: 1,
    name: 'Marcos Lima',
    reason: 'Compromisso familiar',
    cancelledAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isLateCancellation: false,
  },
  {
    id: 2,
    name: 'João Pedro',
    reason: 'Trabalho até mais tarde',
    cancelledAt: new Date(Date.now() - 90 * 60 * 1000),
    isLateCancellation: true,
  },
]

const guestsMock: AdminGuest[] = [
  {
    id: 1,
    name: 'Bruno Reis',
    phone: '(71) 98888-1111',
    responsibleMonthlyPlayer: 'Gabriel Santos',
    paymentStatus: 'paid',
    participationAmount: 25,
  },
  {
    id: 2,
    name: 'Caio Lima',
    phone: '(71) 97777-2222',
    responsibleMonthlyPlayer: 'Lucas Almeida',
    paymentStatus: 'pending',
    participationAmount: 25,
  },
]

export function EventAdminPage() {
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const totalParticipants = confirmedParticipantsMock.length + guestsMock.length
  const spotsRemaining = Math.max(eventMock.maxParticipants - totalParticipants, 0)
  const occupationPercentage = Math.round((totalParticipants / eventMock.maxParticipants) * 100)
  const totalGuestRevenue = guestsMock.reduce((total, guest) => {
    return guest.paymentStatus === 'paid' ? total + guest.participationAmount : total
  }, 0)

  const showFeedback = (message: string) => {
    setSnackbarMessage(message)
  }

  const closeSnackbar = () => {
    setSnackbarMessage('')
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">Administração do evento</Typography>
        <Typography color="text.secondary">
          Gerencie confirmações, ausências, convidados e resumo do próximo baba.
        </Typography>
      </Stack>

      <EventInfoCard event={eventMock} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <EventMetricCard
            label="Confirmados"
            value={confirmedParticipantsMock.length}
            helper="Mensalistas e goleiros"
            icon={<EventAvailableOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <EventMetricCard
            label="Ausentes"
            value={absentParticipantsMock.length}
            helper="Cancelamentos registrados"
            icon={<BlockOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <EventMetricCard
            label="Convidados"
            value={guestsMock.length}
            helper="Vinculados ao evento"
            icon={<PersonAddAltOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <EventMetricCard
            label="Vagas restantes"
            value={spotsRemaining}
            helper="Após confirmações"
            icon={<GroupsOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Ocupação
                </Typography>
                <Typography variant="h2">{occupationPercentage}%</Typography>
                <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {totalParticipants} / {eventMock.maxParticipants} vagas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      R$ {totalGuestRevenue}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={occupationPercentage}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 9 }}>
          <AdminTabsCard
            confirmedParticipants={confirmedParticipantsMock}
            absentParticipants={absentParticipantsMock}
            guests={guestsMock}
            onAction={showFeedback}
          />
        </Grid>
        <Grid size={{ xs: 12, xl: 3 }}>
          <QuickActionsCard onAction={showFeedback} />
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={closeSnackbar}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
