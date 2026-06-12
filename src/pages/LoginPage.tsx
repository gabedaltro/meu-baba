import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'

export function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h1">Meu Baba</Typography>
              <Typography color="text.secondary">Acesse sua conta para gerenciar o baba.</Typography>
            </Box>
            <Stack spacing={2}>
              <TextField label="E-mail" type="email" fullWidth />
              <TextField label="Senha" type="password" fullWidth />
              <Button variant="contained" size="large" startIcon={<LockOutlinedIcon />}>
                Entrar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
