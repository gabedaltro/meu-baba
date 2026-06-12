import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { EventMetricCard } from '../features/nextEvent/components/EventMetricCard'
import { GuestFormCard } from '../features/myGuests/components/GuestFormCard'
import { GuestListCard } from '../features/myGuests/components/GuestListCard'
import type { EventGuest, GuestFormValues } from '../features/myGuests/types'

const nextEventGuestRulesMock = {
  guestsReleased: true,
  maxParticipants: 24,
  confirmedParticipants: 18,
  guestParticipationAmount: 25,
}

const initialGuests: EventGuest[] = [
  {
    id: 1,
    name: 'Bruno Reis',
    phone: '(71) 98888-1111',
    paymentStatus: 'paid',
    participationAmount: 25,
  },
  {
    id: 2,
    name: 'Caio Lima',
    phone: '(71) 97777-2222',
    paymentStatus: 'pending',
    participationAmount: 25,
  },
]

const initialFormValues: GuestFormValues = {
  name: '',
  phone: '',
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function MyGuestsPage() {
  const [guests, setGuests] = useState<EventGuest[]>(initialGuests)
  const [formValues, setFormValues] = useState<GuestFormValues>(initialFormValues)
  const [formError, setFormError] = useState<string>()

  const occupiedSpots = nextEventGuestRulesMock.confirmedParticipants + guests.length
  const spotsRemaining = Math.max(nextEventGuestRulesMock.maxParticipants - occupiedSpots, 0)
  const isEventFull = spotsRemaining === 0
  const isGuestFormDisabled = !nextEventGuestRulesMock.guestsReleased || isEventFull

  const normalizedGuestPhones = useMemo(
    () => guests.map((guest) => normalizePhone(guest.phone)),
    [guests],
  )

  const addGuest = () => {
    const name = formValues.name.trim()
    const phone = formValues.phone.trim()
    const normalizedPhone = normalizePhone(phone)

    if (!name) {
      setFormError('Informe o nome do convidado.')
      return
    }

    if (!normalizedPhone) {
      setFormError('Informe o telefone do convidado.')
      return
    }

    if (normalizedGuestPhones.includes(normalizedPhone)) {
      setFormError('Este telefone já está vinculado a um convidado deste evento.')
      return
    }

    if (isEventFull) {
      setFormError('O evento está lotado. Não é possível adicionar convidados.')
      return
    }

    if (!nextEventGuestRulesMock.guestsReleased) {
      setFormError('Os convidados ainda não estão liberados para este evento.')
      return
    }

    setGuests((currentGuests) => [
      ...currentGuests,
      {
        id: Date.now(),
        name,
        phone,
        paymentStatus: 'pending',
        participationAmount: nextEventGuestRulesMock.guestParticipationAmount,
      },
    ])
    setFormValues(initialFormValues)
    setFormError(undefined)
  }

  const removeGuest = (guestId: number) => {
    setGuests((currentGuests) => currentGuests.filter((guest) => guest.id !== guestId))
    setFormError(undefined)
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">Meus convidados</Typography>
        <Typography color="text.secondary">
          Gerencie os convidados vinculados ao próximo evento.
        </Typography>
      </Stack>

      {!nextEventGuestRulesMock.guestsReleased ? (
        <Alert severity="info" icon={<PersonAddAltOutlinedIcon />}>
          Os convidados ainda não estão liberados para este evento.
        </Alert>
      ) : null}

      {isEventFull ? (
        <Alert severity="warning" icon={<WarningAmberOutlinedIcon />}>
          O evento está lotado. Não é possível adicionar novos convidados.
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Vagas do evento"
            value={nextEventGuestRulesMock.maxParticipants}
            helper="Capacidade total"
            icon={<EventSeatOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Ocupadas"
            value={occupiedSpots}
            helper="Confirmados e convidados"
            icon={<GroupsOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Convidados"
            value={guests.length}
            helper="Vinculados ao evento"
            icon={<PersonAddAltOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Valor da participação
                </Typography>
                <Typography variant="h2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(nextEventGuestRulesMock.guestParticipationAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Por convidado
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <GuestFormCard
        values={formValues}
        disabled={isGuestFormDisabled}
        error={formError}
        onChange={setFormValues}
        onSubmit={addGuest}
      />

      <GuestListCard guests={guests} onRemove={removeGuest} />
    </Stack>
  )
}
