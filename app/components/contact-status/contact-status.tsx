import { cn } from '@shadcn/lib/utils'

/**
 * Get badge classes for a contact status with transparency.
 * Falls back to a neutral style for any status value not in the known map,
 * since the API only types `status` as a free-form string.
 */
export const getContactStatusBadgeClasses = (status: string, className?: string): string => {
  const statusLower = status.toLowerCase()

  const statusClasses: Record<string, string> = {
    active: 'border-success/30 bg-success/10 text-success',
    inactive: 'border-border bg-muted text-muted-foreground',
    pending: 'border-warning/30 bg-warning/10 text-warning',
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
