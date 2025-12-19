import { Plus } from 'lucide-react'
import { Button } from '@shadcn/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shadcn/ui/tooltip'

interface IProps {
  label: string
  onClick: () => void
  size?: 'sm' | 'lg' | 'default' | 'xs' | 'icon' | null | undefined
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | undefined
  name?: string
  icon?: React.ReactNode
}

export default function NewButton({
  label,
  onClick,
  size = 'default',
  variant = 'default',
  name = 'New',
  icon = <Plus />,
}: IProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onClick} size={size} variant={variant}>
            {icon}
            <span className="font-semibold">{name}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>{label}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
