import { cn } from '@shadcn/lib/utils'

export type WaitingListStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'notified'
  | 'accepted'
  | 'declined'
  | 'active'
  | 'inactive'
  | 'cancelled'

/**
 * Get badge classes for waiting list status with transparency
 */
export const getWaitingListStatusBadgeClasses = (status: string, className?: string): string => {
  const statusLower = status.toLowerCase() as WaitingListStatus

  const statusClasses: Record<WaitingListStatus, string> = {
    pending: 'border-warning/30 bg-warning/10 text-warning',
    approved: 'border-info/30 bg-info/10 text-info',
    rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
    notified: 'border-accent bg-accent text-accent-foreground',
    accepted: 'border-success/30 bg-success/10 text-success',
    declined: 'border-secondary bg-secondary text-secondary-foreground',
    active: 'border-success/30 bg-success/10 text-success',
    inactive: 'border-border bg-muted text-muted-foreground',
    cancelled: 'border-destructive/30 bg-destructive/10 text-destructive',
  }

  const defaultClasses =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors capitalize'

  const statusClass = statusClasses[statusLower] || statusClasses.inactive

  return cn(defaultClasses, statusClass, className)
}

/**
 * Capitalize status for display
 */
export const formatWaitingListStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
}

export const WaitingListStatusBadge = ({ status, className, ...props }: StatusBadgeProps) => {
  const badgeClasses = getWaitingListStatusBadgeClasses(status, className)
  const formattedStatus = formatWaitingListStatus(status)

  return (
    <div className={badgeClasses} {...props}>
      {formattedStatus}
    </div>
  )
}
