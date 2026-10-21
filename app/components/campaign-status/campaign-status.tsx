import { cn } from '@shadcn/lib/utils'

/**
 * Get badge classes for a campaign status with transparency.
 * Falls back to a neutral style for any status value not in the known map,
 * since the API only types `status` as a free-form string.
 */
export const getCampaignStatusBadgeClasses = (status: string, className?: string): string => {
  const statusLower = status.toLowerCase()

  const statusClasses: Record<string, string> = {
    draft: 'border-border bg-muted text-muted-foreground',
    scheduled: 'border-warning/30 bg-warning/10 text-warning',
    sending: 'border-info/30 bg-info/10 text-info',
    sent: 'border-success/30 bg-success/10 text-success',
    completed: 'border-success/30 bg-success/10 text-success',
    failed: 'border-destructive/30 bg-destructive/10 text-destructive',
    cancelled: 'border-secondary bg-secondary text-secondary-foreground',
  }

  const defaultClasses =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors capitalize'

  const statusClass = statusClasses[statusLower] || statusClasses.draft

  return cn(defaultClasses, statusClass, className)
}

/**
 * Capitalize status for display
 */
export const formatCampaignStatus = (status: string): string => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

interface CampaignStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
}

export const CampaignStatusBadge = ({ status, className, ...props }: CampaignStatusBadgeProps) => {
  const badgeClasses = getCampaignStatusBadgeClasses(status, className)
  const formattedStatus = formatCampaignStatus(status)

  return (
    <div className={badgeClasses} {...props}>
      {formattedStatus}
    </div>
  )
}
