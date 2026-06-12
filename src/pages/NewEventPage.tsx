import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import { Alert, Button, Grid, Snackbar, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EventRulesTipsCard } from '../features/newEvent/components/EventRulesTipsCard'
import { EventSummaryPreviewCard } from '../features/newEvent/components/EventSummaryPreviewCard'
import { NewEventFormCard } from '../features/newEvent/components/NewEventFormCard'
import type { NewEventFormValues } from '../features/newEvent/types'

const defaultEventDate = new Date()
defaultEventDate.setDate(defaultEventDate.getDate() + 7)

const initialFormValues: NewEventFormValues = {
  title: 'Baba Champion Multi Arena',
  date: defaultEventDate.toISOString().slice(0, 10),
  time: '21:30',
  location: 'Champion Multi Arena',
  notes: '',
  maxParticipants: 24,
  minimumMonthlyPlayersForGuests: 18,
  guestReleaseHoursBefore: 48,
  lateCancellationHoursBefore: 4,
}

export function NewEventPage() {
  const [formValues, setFormValues] = useState<NewEventFormValues>(initialFormValues)
  const [isSuccessSnackbarOpen, setIsSuccessSnackbarOpen] = useState(false)

  const createEvent = () => {
    setIsSuccessSnackbarOpen(true)
  }

  const closeSuccessSnackbar = () => {
    setIsSuccessSnackbarOpen(false)
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h1">Novo evento</Typography>
          <Typography color="text.secondary">
            Crie o próximo baba com os padrões do grupo já preenchidos.
          </Typography>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={Link} to="/" variant="outlined" startIcon={<ArrowBackOutlinedIcon />}>
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={createEvent}>
            Criar evento
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <NewEventFormCard values={formValues} onChange={setFormValues} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <EventSummaryPreviewCard values={formValues} />
            <EventRulesTipsCard />
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={isSuccessSnackbarOpen}
        autoHideDuration={3500}
        onClose={closeSuccessSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSuccessSnackbar} severity="success" variant="filled">
          Evento criado com sucesso.
        </Alert>
      </Snackbar>
    </Stack>
  )
}
