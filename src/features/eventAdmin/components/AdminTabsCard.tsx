import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type {
  AbsentParticipant,
  AdminGuest,
  ConfirmedParticipant,
  GeneralParticipation,
  ParticipantType,
  ParticipationStatus,
  PaymentStatus,
} from '../types'

const participantTypeLabels: Record<ParticipantType, string> = {
  monthly_player: 'Mensalista',
  goalkeeper: 'Goleiro',
}

const participationStatusLabels: Record<ParticipationStatus, { label: string; color: 'default' | 'success' | 'warning' }> = {
  confirmed: { label: 'Confirmado', color: 'success' },
  present: { label: 'Presente', color: 'success' },
  absent: { label: 'Ausente', color: 'warning' },
  pending: { label: 'Pendente', color: 'default' },
}

const paymentStatusLabels: Record<PaymentStatus, { label: string; color: 'default' | 'success' | 'warning' }> = {
  pending: { label: 'Pendente', color: 'warning' },
  paid: { label: 'Pago', color: 'success' },
  exempt: { label: 'Isento', color: 'default' },
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

type AdminTabsCardProps = {
  confirmedParticipants: ConfirmedParticipant[]
  absentParticipants: AbsentParticipant[]
  guests: AdminGuest[]
  onAction: (message: string) => void
}

export function AdminTabsCard({
  confirmedParticipants,
  absentParticipants,
  guests,
  onAction,
}: AdminTabsCardProps) {
  const [activeTab, setActiveTab] = useState(0)
  const generalList = useMemo<GeneralParticipation[]>(() => {
    const confirmedItems: GeneralParticipation[] = confirmedParticipants.map((participant, index) => ({
      id: `participant-${participant.id}`,
      name: participant.name,
      type: participantTypeLabels[participant.type] as GeneralParticipation['type'],
      participationOrder: index + 1,
      status: participationStatusLabels[participant.status].label,
    }))

    const guestItems: GeneralParticipation[] = guests.map((guest, index) => ({
      id: `guest-${guest.id}`,
      name: guest.name,
      type: 'Convidado' as const,
      participationOrder: confirmedParticipants.length + index + 1,
      status: paymentStatusLabels[guest.paymentStatus].label,
    }))

    return [...confirmedItems, ...guestItems].sort(
      (firstItem, secondItem) => firstItem.participationOrder - secondItem.participationOrder,
    )
  }, [confirmedParticipants, guests])

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Tabs
            value={activeTab}
            onChange={(_, value: number) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab label="Confirmados" />
            <Tab label="Ausentes" />
            <Tab label="Convidados" />
            <Tab label="Lista geral" />
          </Tabs>

          {activeTab === 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Data/Hora da confirmação</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {confirmedParticipants.map((participant) => {
                    const status = participationStatusLabels[participant.status]

                    return (
                      <TableRow key={participant.id}>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>
                          <Chip label={participantTypeLabels[participant.type]} size="small" />
                        </TableCell>
                        <TableCell>{dateTimeFormatter.format(participant.confirmedAt)}</TableCell>
                        <TableCell>
                          <Chip label={status.label} color={status.color} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<BlockOutlinedIcon />}
                              onClick={() => onAction(`Confirmação de ${participant.name} removida.`)}
                            >
                              Remover confirmação
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SwapHorizOutlinedIcon />}
                              onClick={() => onAction(`Status de ${participant.name} alterado manualmente.`)}
                            >
                              Alterar status
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : null}

          {activeTab === 1 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Justificativa</TableCell>
                    <TableCell>Data/Hora do cancelamento</TableCell>
                    <TableCell>Indicador</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {absentParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.reason ?? 'Não informado'}</TableCell>
                      <TableCell>{dateTimeFormatter.format(participant.cancelledAt)}</TableCell>
                      <TableCell>
                        {participant.isLateCancellation ? (
                          <Chip
                            icon={<WarningAmberOutlinedIcon />}
                            label="Cancelamento tardio"
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Chip label="Dentro do prazo" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}

          {activeTab === 2 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Telefone</TableCell>
                    <TableCell>Mensalista responsável</TableCell>
                    <TableCell>Status do pagamento</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guests.map((guest) => {
                    const paymentStatus = paymentStatusLabels[guest.paymentStatus]

                    return (
                      <TableRow key={guest.id}>
                        <TableCell>{guest.name}</TableCell>
                        <TableCell>{guest.phone}</TableCell>
                        <TableCell>{guest.responsibleMonthlyPlayer}</TableCell>
                        <TableCell>
                          <Chip
                            icon={<PaidOutlinedIcon />}
                            label={paymentStatus.label}
                            color={paymentStatus.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => onAction(`${guest.name} removido da lista de convidados.`)}
                            >
                              Remover
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<CheckCircleOutlineOutlinedIcon />}
                              onClick={() => onAction(`Pagamento de ${guest.name} marcado como recebido.`)}
                            >
                              Marcar pagamento
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<InfoOutlinedIcon />}
                              onClick={() => onAction(`Detalhes de ${guest.name} abertos.`)}
                            >
                              Detalhes
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : null}

          {activeTab === 3 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 680 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ordem</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generalList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.participationOrder}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
