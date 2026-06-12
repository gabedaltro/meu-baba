import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import type { GuestFormValues } from '../types'

type GuestFormCardProps = {
  values: GuestFormValues
  disabled: boolean
  error?: string
  onChange: (values: GuestFormValues) => void
  onSubmit: () => void
}

export function GuestFormCard({ values, disabled, error, onChange, onSubmit }: GuestFormCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Adicionar convidado</Typography>
            <Typography color="text.secondary">
              Informe nome e telefone para vincular o convidado ao próximo evento.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Nome"
              value={values.name}
              onChange={(event) => onChange({ ...values, name: event.target.value })}
              disabled={disabled}
              fullWidth
            />
            <TextField
              label="Telefone"
              value={values.phone}
              onChange={(event) => onChange({ ...values, phone: event.target.value })}
              disabled={disabled}
              placeholder="(71) 99999-9999"
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<PersonAddAltOutlinedIcon />}
              onClick={onSubmit}
              disabled={disabled}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              Adicionar
            </Button>
          </Stack>

          {error ? (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
