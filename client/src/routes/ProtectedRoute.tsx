import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { isTokenValid } from '@/lib/token'

export function ProtectedRoute() {
  const { isAuthenticated, token, logout } = useAuth()
  const valid = isAuthenticated && isTokenValid(token)

  useEffect(() => {
    if (token && !isTokenValid(token)) {
      logout()
    }
  }, [token, logout])

  if (!valid) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
