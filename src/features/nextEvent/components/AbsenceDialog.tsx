import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'

type AbsenceDialogProps = {
  open: boolean
  reason: string
  isLateCancellation: boolean
  onReasonChange: (reason: string) => void
  onClose: () => void
  onSave: () => void
}

export function AbsenceDialog({
  open,
  reason,
  isLateCancellation,
  onReasonChange,
  onClose,
  onSave,
}: AbsenceDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Informar ausência</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {isLateCancellation ? (
            <Alert severity="warning" icon={<WarningAmberOutlinedIcon />}>
              Você está cancelando com menos de 4 horas de antecedência. O administrador poderá aplicar uma penalização.
            </Alert>
          ) : null}

          <TextField
            label="Justificativa"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Opcional"
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Voltar</Button>
        <Button variant="contained" color="warning" onClick={onSave}>
          Salvar ausência
        </Button>
      </DialogActions>
    </Dialog>
  )
}
