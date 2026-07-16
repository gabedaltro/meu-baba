import { Box, Container } from '@mui/material'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { PlayersPage } from '../pages/PlayersPage'
import { TeamDrawPage } from '../pages/TeamDrawPage'
import { ProtectedRoute } from './ProtectedRoute'

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eef5f0' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {children}
      </Container>
    </Box>
  )
}

function ProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sorteio" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sorteio" element={<ProtectedPage><TeamDrawPage /></ProtectedPage>} />
      <Route path="/events/draw" element={<Navigate to="/sorteio" replace />} />
      <Route path="/jogadores" element={<ProtectedPage><PlayersPage /></ProtectedPage>} />
      <Route path="/players" element={<Navigate to="/jogadores" replace />} />
      <Route path="*" element={<Navigate to="/sorteio" replace />} />
    </Routes>
  )
}

