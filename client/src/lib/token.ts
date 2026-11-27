import { jwtDecode } from 'jwt-decode'

interface JwtWithExp {
  exp?: number
}

/** Check whether a JWT exists and has not expired. */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const decoded = jwtDecode<JwtWithExp>(token)
    if (!decoded.exp) return false
    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
