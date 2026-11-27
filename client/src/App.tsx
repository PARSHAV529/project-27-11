import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface HealthResponse {
  success: boolean
  message: string
  data?: {
    status: string
    environment: string
    database: string
    uptimeSeconds: number
  }
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function checkServerHealth() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/health')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const payload = (await response.json()) as HealthResponse
      setHealth(payload)
    } catch (err) {
      setHealth(null)
      setError(err instanceof Error ? err.message : 'Unable to reach server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Full-Stack Workspace Ready</CardTitle>
          <CardDescription>
            React + TypeScript + Tailwind CSS v4 + shadcn/ui paired with an Express + MongoDB
            backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {health?.data && (
            <div className="bg-muted rounded-md p-3">
              <p className="font-medium">API Status: {health.data.status}</p>
              <p className="text-muted-foreground">Database: {health.data.database}</p>
              <p className="text-muted-foreground">Environment: {health.data.environment}</p>
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3">
              Server check failed: {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => void checkServerHealth()} disabled={loading} className="w-full">
            {loading ? 'Checking API...' : 'Check Server Health'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

export default App
