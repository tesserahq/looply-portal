import { LayoutSelect } from '@/components/form/layout-select'
import { NodeENVType } from '@/libraries/fetch'
import { useCampaigns, useDuplicateCampaign } from '@/resources/hooks/campaigns'
import { useApp } from 'tessera-ui'
import { Button } from '@shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select'
import { cn } from '@shadcn/lib/utils'
import { CopyPlus, FilePlus2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

type CampaignSource = 'clean' | 'duplicate'

interface NewCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiUrl: string
  sendlyApiUrl: string
  nodeEnv: NodeENVType
}

/**
 * Starts a campaign one of two ways. Clean: the user picks the Sendly layout
 * the email will be wrapped in and lands in the editor with an empty body
 * (nothing is created until the form is saved). Duplicate: an existing
 * campaign is copied into a new draft and opened for editing. Nothing is
 * ever created in Sendly.
 */
export function NewCampaignModal({
  open,
  onOpenChange,
  apiUrl,
  sendlyApiUrl,
  nodeEnv,
}: NewCampaignModalProps) {
  const navigate = useNavigate()
  const { token } = useApp()
  const [source, setSource] = useState<CampaignSource>('clean')
  const [layoutId, setLayoutId] = useState<string>('')
  const [sourceCampaignId, setSourceCampaignId] = useState<string>('')

  const config = { apiUrl, token: token!, nodeEnv }

  const {
    data: campaigns,
    isLoading: isLoadingCampaigns,
    isError: isCampaignsError,
  } = useCampaigns(config, { page: 1, size: 100 }, { enabled: open && source === 'duplicate' })

  const { mutateAsync: duplicateCampaign, isPending } = useDuplicateCampaign(config)

  const canContinue = source === 'clean' ? !!layoutId : !!sourceCampaignId

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setSource('clean')
      setLayoutId('')
      setSourceCampaignId('')
    }
  }

  const handleContinue = async () => {
    if (source === 'clean') {
      if (!layoutId) return
      handleOpenChange(false)
      navigate(`/campaigns/new?layout_id=${layoutId}`)
      return
    }

    if (!sourceCampaignId) return
    const copy = await duplicateCampaign(sourceCampaignId)
    handleOpenChange(false)
    navigate(`/campaigns/${copy.id}/edit`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Start a clean campaign from a layout, or duplicate an existing one.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSource('clean')}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors cursor-pointer',
              source === 'clean' ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
            )}>
            <div className="bg-muted mb-3 flex h-9 w-9 items-center justify-center rounded-lg">
              <FilePlus2 size={18} />
            </div>
            <div className="font-medium">Clean campaign</div>
            <div className="text-muted-foreground text-sm">Pick a layout, write the email.</div>
          </button>

          <button
            type="button"
            onClick={() => setSource('duplicate')}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors cursor-pointer',
              source === 'duplicate'
                ? 'border-primary bg-accent'
                : 'border-border hover:bg-accent/50'
            )}>
            <div
              className="bg-primary text-primary-foreground mb-3 flex h-9 w-9 items-center
                justify-center rounded-lg">
              <CopyPlus size={18} />
            </div>
            <div className="font-medium">Duplicate campaign</div>
            <div className="text-muted-foreground text-sm">Reuse a past email.</div>
          </button>
        </div>

        {source === 'clean' ? (
          <div className="mt-2">
            <label className="mb-1.5 block text-sm font-medium">Layout</label>
            <LayoutSelect
              value={layoutId}
              onChange={setLayoutId}
              sendlyApiUrl={sendlyApiUrl}
              nodeEnv={nodeEnv}
            />
          </div>
        ) : (
          <div className="mt-2">
            <label className="mb-1.5 block text-sm font-medium">Campaign</label>
            {isCampaignsError ? (
              <p className="text-destructive text-sm">
                Couldn&apos;t load campaigns. You may not have access to them.
              </p>
            ) : (
              <Select value={sourceCampaignId} onValueChange={setSourceCampaignId}>
                <SelectTrigger>
                  {isLoadingCampaigns ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Choose a campaign" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {(campaigns?.items ?? []).map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!canContinue || isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicating...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
