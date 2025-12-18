import {
  getWaitingListStatusBadgeClasses,
  formatWaitingListStatus,
} from '@/utils/waiting-list-status'

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
