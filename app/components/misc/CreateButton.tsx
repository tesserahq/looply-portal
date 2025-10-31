import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface IProps {
  label: string
  onClick: () => void
  size?: 'sm' | 'lg' | 'default' | 'xs' | 'icon' | null | undefined
}

export default function CreateButton({ label, onClick, size = 'default' }: IProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onClick} size={size}>
            <Plus />
            <span className="font-semibold">New</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>{label}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
