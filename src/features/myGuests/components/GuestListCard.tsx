import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import type { EventGuest, GuestPaymentStatus } from '../types'

const paymentStatusMap: Record<GuestPaymentStatus, { label: string; color: 'default' | 'success' | 'warning' }> = {
  pending: { label: 'Pagamento pendente', color: 'warning' },
  paid: { label: 'Pago', color: 'success' },
  exempt: { label: 'Isento', color: 'default' },
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type GuestListCardProps = {
  guests: EventGuest[]
  onRemove: (guestId: number) => void
}

export function GuestListCard({ guests, onRemove }: GuestListCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Convidados do evento</Typography>
            <Typography color="text.secondary">
              Acompanhe os convidados vinculados ao próximo baba.
            </Typography>
          </Stack>

          {guests.length === 0 ? (
            <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2 }}>
              <Typography color="text.secondary">Nenhum convidado adicionado até agora.</Typography>
            </Box>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={0}>
              {guests.map((guest) => {
                const paymentStatus = paymentStatusMap[guest.paymentStatus]

                return (
                  <Stack
                    key={guest.id}
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { xs: 'stretch', md: 'center' }, py: 2 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }}>{guest.name}</Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
                        <PhoneOutlinedIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          {guest.phone}
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
                      <Chip icon={<PaidOutlinedIcon />} label={paymentStatus.label} color={paymentStatus.color} />
                      <Chip label={currencyFormatter.format(guest.participationAmount)} variant="outlined" />
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineOutlinedIcon />}
                        onClick={() => onRemove(guest.id)}
                      >
                        Remover
                      </Button>
                    </Stack>
                  </Stack>
                )
              })}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
