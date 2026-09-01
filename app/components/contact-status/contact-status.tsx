import { cn } from '@shadcn/lib/utils'

/**
 * Get badge classes for a contact status with transparency.
 * Falls back to a neutral style for any status value not in the known map,
 * since the API only types `status` as a free-form string.
 */
export const getContactStatusBadgeClasses = (status: string, className?: string): string => {
  const statusLower = status.toLowerCase()

  const statusClasses: Record<string, string> = {
    active:
      'border-green-200/50 bg-green-50/80 text-green-700 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-300',
    inactive:
      'border-gray-200/50 bg-gray-50/80 text-gray-700 dark:border-gray-700/50 dark:bg-gray-800/30 dark:text-gray-300',
    pending:
      'border-amber-200/50 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300',
  }

  const defaultClasses =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors capitalize'

  const statusClass = statusClasses[statusLower] || statusClasses.inactive

  return cn(defaultClasses, statusClass, className)
}

/**
 * Capitalize status for display
 */
export const formatContactStatus = (status: string): string => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

interface ContactStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
}

export const ContactStatusBadge = ({ status, className, ...props }: ContactStatusBadgeProps) => {
  const badgeClasses = getContactStatusBadgeClasses(status, className)
  const formattedStatus = formatContactStatus(status)

  return (
    <div className={badgeClasses} {...props}>
      {formattedStatus}
    </div>
  )
}
