import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined'
import { AppBar, Avatar, Box, Container, Stack, Toolbar, Typography } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TeamDrawPage } from '../pages/TeamDrawPage'

function DrawOnlyLayout() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <SportsSoccerOutlinedIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h3">Meu Baba</Typography>
              <Typography variant="body2" color="text.secondary">
                Sorteio dos times
              </Typography>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <TeamDrawPage />
      </Container>
    </Box>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DrawOnlyLayout />} />
      <Route path="/events/draw" element={<DrawOnlyLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
