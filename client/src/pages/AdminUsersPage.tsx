import axios from 'axios'
import { Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getUsers, updateUserRole } from '@/api/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/auth-context'
import { getErrorMessage } from '@/lib/getErrorMessage'
import type { Role, User } from '@/types/auth'

const PAGE_LIMIT = 10

const ROLE_LABELS: Record<Role, string> = {
  employee: 'Employee',
  agent: 'Agent',
  admin: 'Admin',
}

function parsePage(raw: string | null): number {
  const num = Number(raw)
  return Number.isInteger(num) && num >= 1 ? num : 1
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const page = parsePage(searchParams.get('page'))

  const [searchInput, setSearchInput] = useState(search)
  const [prevUrlSearch, setPrevUrlSearch] = useState(search)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [pendingChange, setPendingChange] = useState<{
    target: User
    nextRole: Role
  } | null>(null)
  const [updatingRole, setUpdatingRole] = useState(false)

  if (search !== prevUrlSearch) {
    setPrevUrlSearch(search)
    setSearchInput(search)
  }

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === search) return

    const timer = window.setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (trimmed) {
          next.set('search', trimmed)
        } else {
          next.delete('search')
        }
        next.set('page', '1')
        return next
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [searchInput, search, setSearchParams])

  const setPageParam = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(nextPage))
        return next
      })
    },
    [setSearchParams],
  )

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function fetchUsers() {
      await Promise.resolve()
      if (!active) return
      setIsFetching(true)
      setError(null)
      try {
        const res = await getUsers({ search, page, limit: PAGE_LIMIT }, controller.signal)
        if (!active) return
        setUsers(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
        setHasLoaded(true)
      } catch (err) {
        if (!active || axios.isCancel(err)) return
        setError(getErrorMessage(err, 'Failed to load users'))
        setHasLoaded(true)
      } finally {
        if (active) {
          setIsFetching(false)
        }
      }
    }

    void fetchUsers()

    return () => {
      active = false
      controller.abort()
    }
  }, [search, page, refreshKey])

  async function handleConfirmRoleChange() {
    if (!pendingChange) return
    setUpdatingRole(true)
    try {
      const updated = await updateUserRole(pendingChange.target.id, pendingChange.nextRole)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success('User role updated')
      setPendingChange(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update user role'))
      setPendingChange(null)
    } finally {
      setUpdatingRole(false)
    }
  }

  const displayTotalPages = Math.max(1, totalPages)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Manage user roles across employees, support agents, and administrators.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email..."
          className="pr-9 pl-9"
          aria-label="Search users by name or email"
        />
        {hasLoaded && isFetching && (
          <Loader2
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
            aria-label="Updating users"
          />
        )}
      </div>

      {!hasLoaded ? (
        <div className="rounded-md border p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unable to load users</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHasLoaded(false)
                setRefreshKey((k) => k + 1)
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card className={isFetching ? 'opacity-60 transition-opacity duration-150' : 'transition-opacity duration-150'}>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {isFetching ? 'Updating users...' : 'No users found'}
            </p>
            {search && !isFetching && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput('')
                  setSearchParams({ page: '1' })
                }}
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={isFetching ? 'space-y-4 opacity-60 transition-opacity duration-150' : 'space-y-4 transition-opacity duration-150'}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-64">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  const selectValue =
                    pendingChange?.target.id === u.id ? pendingChange.nextRole : u.role

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Select
                            value={selectValue}
                            disabled={isSelf || updatingRole}
                            onValueChange={(nextRole) => {
                              if (nextRole !== u.role) {
                                setPendingChange({ target: u, nextRole: nextRole as Role })
                              }
                            }}
                          >
                            <SelectTrigger className="w-40" aria-label={`Change role for ${u.name}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          {isSelf && (
                            <p className="text-muted-foreground text-xs">
                              You can&apos;t change your own role
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 pt-2 text-sm sm:flex-row">
            <p className="text-muted-foreground">
              {total} {total === 1 ? 'user' : 'users'} total
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPageParam(page - 1)}
              >
                Prev
              </Button>
              <span className="text-muted-foreground">
                Page {page} of {displayTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= displayTotalPages || isFetching}
                onClick={() => setPageParam(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(pendingChange)}
        onOpenChange={(open) => {
          if (!open && !updatingRole) {
            setPendingChange(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              {pendingChange
                ? `Change ${pendingChange.target.name} from ${ROLE_LABELS[pendingChange.target.role]} to ${ROLE_LABELS[pendingChange.nextRole]}?`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingChange(null)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmRoleChange()} disabled={updatingRole}>
              {updatingRole ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
