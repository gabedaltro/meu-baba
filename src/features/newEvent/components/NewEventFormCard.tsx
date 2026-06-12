import { Card, CardContent, Divider, Grid, Stack, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import type { NewEventFormValues } from '../types'

type NewEventFormCardProps = {
  values: NewEventFormValues
  onChange: (values: NewEventFormValues) => void
}

export function NewEventFormCard({ values, onChange }: NewEventFormCardProps) {
  const updateField = <Key extends keyof NewEventFormValues>(
    key: Key,
    value: NewEventFormValues[Key],
  ) => {
    onChange({ ...values, [key]: value })
  }

  const updateNumberField = (key: keyof NewEventFormValues, value: string) => {
    updateField(key, Number(value || 0) as never)
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Informações do evento</Typography>
            <Typography color="text.secondary">
              Os principais dados já vêm preenchidos para acelerar a criação.
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Título"
                value={values.title}
                onChange={(event) => updateField('title', event.target.value)}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Data"
                value={values.date ? dayjs(values.date) : null}
                onChange={(date) => updateField('date', date?.format('YYYY-MM-DD') ?? '')}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Hora"
                type="time"
                value={values.time}
                onChange={(event) => updateField('time', event.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Local"
                value={values.location}
                onChange={(event) => updateField('location', event.target.value)}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Observações"
                value={values.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider />

          <Stack spacing={0.5}>
            <Typography variant="h2">Regras do evento</Typography>
            <Typography color="text.secondary">
              Ajuste apenas quando este baba tiver uma condição diferente.
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Máximo de participantes"
                type="number"
                value={values.maxParticipants}
                onChange={(event) => updateNumberField('maxParticipants', event.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mínimo de mensalistas"
                type="number"
                value={values.minimumMonthlyPlayersForGuests}
                onChange={(event) => updateNumberField('minimumMonthlyPlayersForGuests', event.target.value)}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Liberação de convidados"
                type="number"
                value={values.guestReleaseHoursBefore}
                onChange={(event) => updateNumberField('guestReleaseHoursBefore', event.target.value)}
                required
                fullWidth
                helperText="Horas antes do evento"
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Cancelamento tardio"
                type="number"
                value={values.lateCancellationHoursBefore}
                onChange={(event) => updateNumberField('lateCancellationHoursBefore', event.target.value)}
                required
                fullWidth
                helperText="Horas antes do evento"
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  )
}
