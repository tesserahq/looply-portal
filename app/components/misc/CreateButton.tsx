import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface IProps {
  label: string
  onClick: () => void
}

export default function CreateButton({ label, onClick }: IProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onClick}>
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
