import { cn } from '@shadcn/lib/utils'

/**
 * Get badge classes for a campaign status with transparency.
 * Falls back to a neutral style for any status value not in the known map,
 * since the API only types `status` as a free-form string.
 */
export const getCampaignStatusBadgeClasses = (status: string, className?: string): string => {
  const statusLower = status.toLowerCase()

  const statusClasses: Record<string, string> = {
    draft:
      'border-gray-200/50 bg-gray-50/80 text-gray-700 dark:border-gray-700/50 dark:bg-gray-800/30 dark:text-gray-300',
    scheduled:
      'border-amber-200/50 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-300',
    sending:
      'border-blue-200/50 bg-blue-50/80 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300',
    sent: 'border-emerald-200/50 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-300',
    completed:
      'border-green-200/50 bg-green-50/80 text-green-700 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-300',
    failed:
      'border-red-200/50 bg-red-50/80 text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300',
    cancelled:
      'border-orange-200/50 bg-orange-50/80 text-orange-700 dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-300',
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
