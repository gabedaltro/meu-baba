import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import ReduceCapacityOutlinedIcon from '@mui/icons-material/ReduceCapacityOutlined'
import { Grid, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { AbsenceDialog } from '../features/nextEvent/components/AbsenceDialog'
import { EventMetricCard } from '../features/nextEvent/components/EventMetricCard'
import { EventSummaryCard } from '../features/nextEvent/components/EventSummaryCard'
import { UserParticipationCard } from '../features/nextEvent/components/UserParticipationCard'
import type { NextEvent, UserParticipation } from '../features/nextEvent/types'

const nextEventMock: NextEvent = {
  id: 1,
  startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
  location: 'Arena principal',
  status: 'open',
  maxParticipants: 24,
  confirmedCount: 18,
  guestCount: 2,
}

const initialParticipation: UserParticipation = {
  status: 'pending',
}

export function NextEventPage() {
  const [participation, setParticipation] = useState<UserParticipation>(initialParticipation)
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false)
  const [absenceReason, setAbsenceReason] = useState('')

  const [isLateCancellation] = useState(() => {
    const millisecondsUntilEvent = nextEventMock.startsAt.getTime() - Date.now()
    return millisecondsUntilEvent < 4 * 60 * 60 * 1000
  })

  const confirmedCount =
    participation.status === 'confirmed'
      ? nextEventMock.confirmedCount + 1
      : nextEventMock.confirmedCount

  const spotsRemaining = Math.max(nextEventMock.maxParticipants - confirmedCount, 0)

  const confirmParticipation = () => {
    setParticipation({
      status: 'confirmed',
      respondedAt: new Date(),
    })
    setAbsenceReason('')
  }

  const openAbsenceDialog = () => {
    setAbsenceReason(participation.absenceReason ?? '')
    setIsAbsenceDialogOpen(true)
  }

  const closeAbsenceDialog = () => {
    setIsAbsenceDialogOpen(false)
  }

  const saveAbsence = () => {
    setParticipation({
      status: 'absent',
      respondedAt: new Date(),
      absenceReason: absenceReason.trim() || undefined,
    })
    setIsAbsenceDialogOpen(false)
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">Próximo evento</Typography>
        <Typography color="text.secondary">
          Confirme presença ou informe ausência para o próximo baba.
        </Typography>
      </Stack>

      <EventSummaryCard event={nextEventMock} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Quantidade de vagas"
            value={nextEventMock.maxParticipants}
            helper="Capacidade total"
            icon={<ReduceCapacityOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Confirmados"
            value={confirmedCount}
            helper="Mensalistas e goleiros"
            icon={<EventAvailableOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Convidados"
            value={nextEventMock.guestCount}
            helper="Incluídos no evento"
            icon={<PersonAddAltOutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <EventMetricCard
            label="Vagas restantes"
            value={spotsRemaining}
            helper="Atualizado pela sua resposta"
            icon={<GroupsOutlinedIcon color="primary" />}
          />
        </Grid>
      </Grid>

      <UserParticipationCard
        participation={participation}
        onConfirm={confirmParticipation}
        onOpenAbsenceDialog={openAbsenceDialog}
      />

      <AbsenceDialog
        open={isAbsenceDialogOpen}
        reason={absenceReason}
        isLateCancellation={isLateCancellation}
        onReasonChange={setAbsenceReason}
        onClose={closeAbsenceDialog}
        onSave={saveAbsence}
      />
    </Stack>
  )
}
