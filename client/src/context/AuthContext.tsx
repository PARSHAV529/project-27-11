import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '@/api/auth.api'
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/api/axios'
import { FullPageLoader } from '@/components/FullPageLoader'
import { AuthContext, type AuthContextValue } from '@/context/auth-context'
import { isTokenValid } from '@/lib/token'
import type { LoginPayload, SignupPayload, User } from '@/types/auth'

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const saveAuth = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      const storedUser = readStoredUser()

      if (!storedToken || !isTokenValid(storedToken)) {
        clearAuth()
        if (active) setIsLoading(false)
        return
      }

      setToken(storedToken)
      if (storedUser) {
        setUser(storedUser)
      }

      try {
        const { user: freshUser } = await authApi.getMe()
        if (active) {
          saveAuth(storedToken, freshUser)
        }
      } catch {
        if (active) {
          clearAuth()
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [clearAuth, saveAuth])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await authApi.login(payload)
      saveAuth(data.token, data.user)
    },
    [saveAuth],
  )

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const data = await authApi.signup(payload)
      saveAuth(data.token, data.user)
    },
    [saveAuth],
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token && isTokenValid(token)),
      login,
      signup,
      logout,
    }),
    [user, token, login, signup, logout],
  )

  if (isLoading) {
    return <FullPageLoader />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
