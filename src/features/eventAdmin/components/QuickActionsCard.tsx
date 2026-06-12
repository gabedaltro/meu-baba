import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import ShuffleOutlinedIcon from '@mui/icons-material/ShuffleOutlined'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'

type QuickActionsCardProps = {
  onAction: (message: string) => void
}

export function QuickActionsCard({ onAction }: QuickActionsCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Ações rápidas</Typography>
            <Typography color="text.secondary">
              Controles operacionais para antes, durante e após o baba.
            </Typography>
          </Stack>

          <Button
            variant="contained"
            size="large"
            startIcon={<ShuffleOutlinedIcon />}
            onClick={() => onAction('Sorteio gerado com dados mockados.')}
            fullWidth
          >
            Gerar sorteio
          </Button>

          <Button
            variant="outlined"
            startIcon={<LockOutlinedIcon />}
            onClick={() => onAction('Confirmações encerradas para este evento.')}
            fullWidth
          >
            Encerrar confirmações
          </Button>

          <Button
            variant="outlined"
            startIcon={<LockOpenOutlinedIcon />}
            onClick={() => onAction('Evento reaberto para novas confirmações.')}
            fullWidth
          >
            Reabrir evento
          </Button>

          <Button
            variant="outlined"
            startIcon={<AssignmentTurnedInOutlinedIcon />}
            onClick={() => onAction('Registro de presenças aberto.')}
            fullWidth
          >
            Registrar presenças
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
