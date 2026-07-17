import { CircularProgress, Stack } from '@mui/material'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/authContext'

type ProtectedRouteProps = {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAdmin, isAuthenticated, isSessionLoading } = useAuth()

  if (isSessionLoading) {
    return (
      <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/sorteio" replace />
  }

  return children
}
