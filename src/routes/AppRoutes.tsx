import { Box, Container } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TeamDrawPage } from '../pages/TeamDrawPage'

function DrawOnlyLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eef5f0' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
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
