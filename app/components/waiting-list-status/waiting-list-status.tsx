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
    pending:
      'border-amber-200/50 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300',
    approved:
      'border-blue-200/50 bg-blue-50/80 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300',
    rejected:
      'border-red-200/50 bg-red-50/80 text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300',
    notified:
      'border-purple-200/50 bg-purple-50/80 text-purple-700 dark:border-purple-800/50 dark:bg-purple-900/30 dark:text-purple-300',
    accepted:
      'border-green-200/50 bg-green-50/80 text-green-700 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-300',
    declined:
      'border-orange-200/50 bg-orange-50/80 text-orange-700 dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-300',
    active:
      'border-emerald-200/50 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-300',
    inactive:
      'border-gray-200/50 bg-gray-50/80 text-gray-700 dark:border-gray-700/50 dark:bg-gray-800/30 dark:text-gray-300',
    cancelled:
      'border-red-200/50 bg-red-50/80 text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300',
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
