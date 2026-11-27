import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { isTokenValid } from '@/lib/token'

export function PublicRoute() {
  const { isAuthenticated, token } = useAuth()

  if (isAuthenticated && isTokenValid(token)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
