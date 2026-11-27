import { Badge } from '@/components/ui/badge'
import type { TicketPriority } from '@/types/ticket'

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  medium: {
    label: 'Medium',
    className:
      'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  },
  high: {
    label: 'High',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300',
  },
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
