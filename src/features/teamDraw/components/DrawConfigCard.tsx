import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import { Box, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'

type DrawConfigCardProps = {
  maxPlayersPerTeam: number
  onMaxPlayersPerTeamChange: (maxPlayersPerTeam: number) => void
}

export function DrawConfigCard({
  maxPlayersPerTeam,
  onMaxPlayersPerTeamChange,
}: DrawConfigCardProps) {
  const updateValue = (value: number) => {
    onMaxPlayersPerTeamChange(Math.max(1, value))
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
        Jogadores de linha por time
      </Typography>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          width: 'fit-content',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          p: 0.5,
        }}
      >
        <Tooltip title="Diminuir">
          <span>
            <IconButton
              size="small"
              onClick={() => updateValue(maxPlayersPerTeam - 1)}
              disabled={maxPlayersPerTeam <= 1}
              aria-label="Diminuir jogadores por time"
            >
              <RemoveOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <TextField
          type="number"
          value={maxPlayersPerTeam}
          onChange={(event) => updateValue(Number(event.target.value || 1))}
          slotProps={{
            htmlInput: {
              min: 1,
              'aria-label': 'Jogadores de linha por time',
              style: { textAlign: 'center', padding: 0, fontWeight: 800, fontSize: 20 },
            },
          }}
          sx={{
            width: 52,
            '& fieldset': { border: 0 },
          }}
        />
        <Tooltip title="Aumentar">
          <IconButton
            size="small"
            onClick={() => updateValue(maxPlayersPerTeam + 1)}
            aria-label="Aumentar jogadores por time"
          >
            <AddOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  )
}
