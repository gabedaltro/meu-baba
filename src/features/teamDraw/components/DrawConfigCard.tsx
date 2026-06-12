import {
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { DrawMode } from '../types'

type DrawConfigCardProps = {
  maxPlayersPerTeam: number
  drawMode: DrawMode
  onMaxPlayersPerTeamChange: (maxPlayersPerTeam: number) => void
  onDrawModeChange: (drawMode: DrawMode) => void
}

export function DrawConfigCard({
  maxPlayersPerTeam,
  drawMode,
  onMaxPlayersPerTeamChange,
  onDrawModeChange,
}: DrawConfigCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h2">Configuração do sorteio</Typography>
            <Typography color="text.secondary">Defina como os times serão formados.</Typography>
          </Stack>

          <TextField
            label="Máximo de jogadores de linha por time"
            type="number"
            value={maxPlayersPerTeam}
            onChange={(event) => onMaxPlayersPerTeamChange(Number(event.target.value || 1))}
            helperText="Goleiros não entram nesse limite"
            fullWidth
            required
            slotProps={{ htmlInput: { min: 1 } }}
          />

          <FormControl>
            <FormLabel>Tipo de sorteio</FormLabel>
            <RadioGroup
              value={drawMode}
              onChange={(event) => onDrawModeChange(event.target.value as DrawMode)}
            >
              <FormControlLabel value="random" control={<Radio />} label="Aleatório" />
              <FormControlLabel
                value="balanced"
                disabled
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography>Balanceado</Typography>
                    <Chip label="Em breve" size="small" color="secondary" variant="outlined" />
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  )
}
