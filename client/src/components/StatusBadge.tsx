import { Badge } from '@/components/ui/badge'
import type { TicketStatus } from '@/types/ticket'

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  resolved: {
    label: 'Resolved',
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300',
  },
  closed: {
    label: 'Closed',
    className:
      'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
