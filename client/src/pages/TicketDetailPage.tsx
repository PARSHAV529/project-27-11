import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { ArrowLeft, Trash2, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { getApiErrorMessage } from '@/api/axios'
import {
  addComment,
  assignToMe,
  deleteTicket,
  getTicket,
  updateStatus,
} from '@/api/tickets'
import { PriorityBadge } from '@/components/PriorityBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth-context'
import type { Ticket, TicketStatus } from '@/types/ticket'

const commentSchema = z.object({
  text: z.string().trim().min(1, 'Comment text is required'),
})

type CommentFormValues = z.infer<typeof commentSchema>

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  })

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    let active = true

    async function fetchDetail() {
      await Promise.resolve()
      if (!active) return
      setLoading(true)
      setError(null)
      setNotFound(false)

      try {
        const data = await getTicket(id!, controller.signal)
        if (!active) return
        setTicket(data)
      } catch (err) {
        if (!active || axios.isCancel(err)) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(getApiErrorMessage(err, 'Failed to load ticket'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchDetail()

    return () => {
      active = false
      controller.abort()
    }
  }, [id, refreshKey])

  async function onSubmitComment(values: CommentFormValues) {
    if (!ticket) return
    try {
      const updated = await addComment(ticket._id, values.text)
      setTicket(updated)
      form.reset()
      toast.success('Comment added')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add comment'))
    }
  }

  async function handleConfirmDelete() {
    if (!ticket) return
    setDeleting(true)
    try {
      await deleteTicket(ticket._id)
      toast.success('Ticket deleted')
      setDeleteDialogOpen(false)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete ticket'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatusChange(nextStatus: TicketStatus) {
    if (!ticket || nextStatus === ticket.status) return
    setUpdatingStatus(true)
    try {
      const updated = await updateStatus(ticket._id, nextStatus)
      setTicket(updated)
      toast.success('Ticket status updated')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update status'))
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleAssignToMe() {
    if (!ticket) return
    setAssigning(true)
    try {
      const updated = await assignToMe(ticket._id)
      setTicket(updated)
      toast.success('Ticket assigned to you')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to assign ticket'))
    } finally {
      setAssigning(false)
    }
  }

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/dashboard">
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>
    </Button>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {backLink}
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          <CardHeader>
            <CardTitle>Ticket not found</CardTitle>
            <CardDescription>
              The ticket does not exist or you do not have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          <CardHeader>
            <CardTitle>Unable to load ticket</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3 text-sm">
            <p className="text-destructive">{error ?? 'Unexpected error'}</p>
            <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin'
  const isAssignedToMe = Boolean(user && ticket.assignedTo?._id === user.id)
  const canDelete = user?.id === ticket.createdBy._id && ticket.status === 'open'
  const sortedComments = [...ticket.comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <div className="space-y-6">
      <div>{backLink}</div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl leading-snug">{ticket.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            {canDelete && (
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Ticket</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &ldquo;{ticket.title}&rdquo;? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => void handleConfirmDelete()}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete Ticket'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

          <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">Created By</p>
              <p className="font-medium">{ticket.createdBy.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Assigned To</p>
              <p className="font-medium">
                {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Created Date</p>
              <p className="font-medium">{formatDateTime(ticket.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            {isAgentOrAdmin ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => void handleStatusChange(value as TicketStatus)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-40" aria-label="Change ticket status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleAssignToMe()}
                  disabled={assigning || isAssignedToMe}
                >
                  <UserCheck className="size-4" />
                  {assigning ? 'Assigning...' : isAssignedToMe ? 'Assigned to you' : 'Assign to me'}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Only support agents can change the status of this ticket.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comments ({sortedComments.length})</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {sortedComments.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment) => {
                const author =
                  typeof comment.author === 'object' && comment.author !== null
                    ? comment.author
                    : null

                return (
                  <div key={comment._id} className="space-y-2 rounded-lg border p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{author?.name ?? 'User'}</span>
                        {author?.role && (
                          <Badge variant="outline" className="capitalize">
                            {author.role}
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                  </div>
                )
              })}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={(e) => void form.handleSubmit(onSubmitComment)(e)}
              className="space-y-3 border-t pt-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add a comment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write an update or reply..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
