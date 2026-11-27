import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { isTokenValid } from '@/lib/token'

export function AdminRoute() {
  const { user, token, isAuthenticated } = useAuth()
  const validSession = isAuthenticated && isTokenValid(token)
  const isAdmin = validSession && user?.role === 'admin'

  useEffect(() => {
    if (validSession && user?.role !== 'admin') {
      toast.error("You don't have access to that page", { id: 'admin-access-denied' })
    }
  }, [validSession, user?.role])

  if (!validSession) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
