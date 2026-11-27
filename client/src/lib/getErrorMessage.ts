import axios from 'axios'

/** Extract a consistent, user-friendly error message from API or network errors. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return 'Cannot reach the server'
    }
    if (error.response.status === 429) {
      return 'Too many attempts, please try again later'
    }
    return error.response.data?.message || error.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
