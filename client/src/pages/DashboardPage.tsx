import axios from 'axios'
import { Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/axios'
import { getTickets } from '@/api/tickets'
import { CreateTicketDialog } from '@/components/CreateTicketDialog'
import { PriorityBadge } from '@/components/PriorityBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { Ticket, TicketPriority, TicketStatus } from '@/types/ticket'

const PAGE_LIMIT = 10
const VALID_STATUSES = new Set<TicketStatus>(['open', 'in_progress', 'resolved', 'closed'])
const VALID_PRIORITIES = new Set<TicketPriority>(['low', 'medium', 'high'])

function parseStatus(raw: string | null): TicketStatus | undefined {
  return raw && VALID_STATUSES.has(raw as TicketStatus) ? (raw as TicketStatus) : undefined
}

function parsePriority(raw: string | null): TicketPriority | undefined {
  return raw && VALID_PRIORITIES.has(raw as TicketPriority) ? (raw as TicketPriority) : undefined
}

function parsePage(raw: string | null): number {
  const num = Number(raw)
  return Number.isInteger(num) && num >= 1 ? num : 1
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const status = parseStatus(searchParams.get('status'))
  const priority = parsePriority(searchParams.get('priority'))
  const page = parsePage(searchParams.get('page'))

  const [searchInput, setSearchInput] = useState(search)
  const [prevUrlSearch, setPrevUrlSearch] = useState(search)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  if (search !== prevUrlSearch) {
    setPrevUrlSearch(search)
    setSearchInput(search)
  }

  // Debounce search input updates into URL query params and reset to page 1.
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

  const updateFilter = useCallback(
    (key: 'status' | 'priority', value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value === 'all') {
          next.delete(key)
        } else {
          next.set(key, value)
        }
        next.set('page', '1')
        return next
      })
    },
    [setSearchParams],
  )

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

    async function fetchList() {
      await Promise.resolve()
      if (!active) return
      setIsFetching(true)
      setError(null)
      try {
        const res = await getTickets(
          { search, status, priority, page, limit: PAGE_LIMIT },
          controller.signal,
        )
        if (!active) return
        setTickets(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
        setHasLoaded(true)
      } catch (err) {
        if (!active || axios.isCancel(err)) return
        setError(getApiErrorMessage(err, 'Failed to load tickets'))
        setHasLoaded(true)
      } finally {
        if (active) {
          setIsFetching(false)
        }
      }
    }

    void fetchList()

    return () => {
      active = false
      controller.abort()
    }
  }, [search, status, priority, page, refreshKey])

  function handleTicketCreated() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      return next
    })
    setRefreshKey((k) => k + 1)
  }

  const heading = user?.role === 'employee' ? 'My Tickets' : 'All Tickets'
  const displayTotalPages = Math.max(1, totalPages)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-muted-foreground text-sm">
            {user?.role === 'employee'
              ? 'View and submit your support requests.'
              : 'Monitor and manage all support tickets.'}
          </p>
        </div>

        <CreateTicketDialog onCreated={handleTicketCreated} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tickets by title..."
            className="pr-9 pl-9"
            aria-label="Search tickets by title"
          />
          {hasLoaded && isFetching && (
            <Loader2
              className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
              aria-label="Updating tickets"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={status ?? 'all'} onValueChange={(v) => updateFilter('status', v)}>
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priority ?? 'all'} onValueChange={(v) => updateFilter('priority', v)}>
            <SelectTrigger className="w-40" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content states */}
      {!hasLoaded ? (
        <div className="space-y-3">
          <div className="hidden rounded-md border p-4 md:block">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unable to load tickets</CardTitle>
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
      ) : tickets.length === 0 ? (
        <Card className={isFetching ? 'opacity-60 transition-opacity duration-150' : 'transition-opacity duration-150'}>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {isFetching ? 'Updating tickets...' : 'No tickets found'}
            </p>
            {(search || status || priority) && !isFetching && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput('')
                  setSearchParams({ page: '1' })
                }}
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={isFetching ? 'space-y-4 opacity-60 transition-opacity duration-150' : 'space-y-4 transition-opacity duration-150'}>
          {/* Desktop Table */}
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket._id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    <TableCell className="max-w-xs font-medium">
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>{ticket.createdBy.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {tickets.map((ticket) => (
              <Link key={ticket._id} to={`/tickets/${ticket._id}`} className="block">
                <Card className="transition-colors hover:bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{ticket.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                    <div className="text-muted-foreground grid grid-cols-2 gap-1 text-xs">
                      <span>By: {ticket.createdBy.name}</span>
                      <span>
                        Assigned: {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                      </span>
                      <span className="col-span-2">Created: {formatDate(ticket.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 pt-2 text-sm sm:flex-row">
            <p className="text-muted-foreground">
              {total} {total === 1 ? 'ticket' : 'tickets'} total
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
    </div>
  )
}
