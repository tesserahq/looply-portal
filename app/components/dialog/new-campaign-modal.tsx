import { LayoutSelect } from '@/components/form/layout-select'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { useState } from 'react'
import { useNavigate } from 'react-router'

interface NewCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiUrl: string
  sendlyApiUrl: string
  nodeEnv: NodeENVType
}

/**
 * Starts a clean campaign: the user picks the Sendly layout the email will be
 * wrapped in, and lands in the editor with an empty body. Nothing is created
 * in Sendly — the campaign itself is only created when the form is saved.
 */
export function NewCampaignModal({
  open,
  onOpenChange,
  sendlyApiUrl,
  nodeEnv,
}: NewCampaignModalProps) {
  const navigate = useNavigate()
  const [layoutId, setLayoutId] = useState<string>('')

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) setLayoutId('')
  }

  const handleContinue = () => {
    if (!layoutId) return
    handleOpenChange(false)
    navigate(`/campaigns/new?layout_id=${layoutId}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Start a clean campaign by choosing the layout your email will be wrapped in.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <label className="mb-1.5 block text-sm font-medium">Layout</label>
          <LayoutSelect
            value={layoutId}
            onChange={setLayoutId}
            sendlyApiUrl={sendlyApiUrl}
            nodeEnv={nodeEnv}
          />
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!layoutId}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
