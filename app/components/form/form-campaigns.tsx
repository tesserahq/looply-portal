import { useApp } from 'tessera-ui'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { Dialog, DialogContent } from '@/modules/shadcn/ui/dialog'
import { Input } from '@/modules/shadcn/ui/input'
import { useCampaigns } from '@/resources/hooks/campaigns'
import { cn } from '@shadcn/lib/utils'
import { type DialogProps } from '@radix-ui/react-dialog'
import { ChevronsUpDownIcon, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface CampaignOption {
  id: string
  name: string
}

export interface CampaignSelectProps {
  value?: string
  onChange: (campaign: CampaignOption | undefined) => void
  apiUrl: string
  nodeEnv: NodeENVType
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  dialogProps?: DialogProps
}

/**
 * A `campaign_activity` segment condition can only reference a `completed`
 * campaign - the backend rejects anything else (see docs/segments.md) - so
 * this only ever offers completed campaigns, unlike a general campaign picker.
 */
export const CampaignSelect = ({
  value,
  onChange,
  apiUrl,
  nodeEnv,
  placeholder = 'Select a completed campaign',
  searchPlaceholder = 'Search campaigns...',
  emptyText = 'No completed campaigns found.',
  disabled = false,
  dialogProps,
}: CampaignSelectProps) => {
  const { token } = useApp()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: campaigns, isLoading } = useCampaigns(
    { apiUrl, token: token!, nodeEnv },
    { page: 1, size: 100 },
    { enabled: open || value !== '' }
  )

  const campaignOptions = useMemo(() => {
    return (
      campaigns?.items
        .filter((campaign) => campaign.status === 'completed')
        .map((campaign) => ({ id: campaign.id, name: campaign.name })) || []
    )
  }, [campaigns])

  const selectedCampaign = campaignOptions.find((campaign) => campaign.id === value)

  const handleSelect = (campaignId: string) => {
    if (campaignId === value) {
      onChange(undefined)
    } else {
      onChange(campaignOptions.find((campaign) => campaign.id === campaignId))
    }
    setOpen(false)
  }

  const filteredCampaigns = useMemo(() => {
    if (!search) return campaignOptions
    const searchLower = search.toLowerCase()
    return campaignOptions.filter((campaign) => campaign.name.toLowerCase().includes(searchLower))
  }, [campaignOptions, search])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setSearch('')
  }

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        type="button"
        aria-expanded={open}
        disabled={isLoading || disabled}
        onClick={() => setOpen(true)}
        className="w-full justify-between rounded bg-transparent">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : selectedCampaign ? (
          <div className="truncate">
            <span className="truncate font-medium">{selectedCampaign.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange} {...dialogProps}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex items-center border-b px-3">
              <Search className="mr-1 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 border-0 bg-transparent outline-none focus-visible:ring-0
                  focus-visible:ring-offset-0"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-x-hidden overflow-y-auto p-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={30} className="shrink-0 animate-spin opacity-50" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {filteredCampaigns.map((campaign) => {
                    const isSelected = value === campaign.id

                    return (
                      <div
                        key={campaign.id}
                        onClick={() => handleSelect(campaign.id)}
                        className={cn(
                          `dark:hover:bg-navy-300/20 relative flex cursor-pointer items-center gap-2
                            rounded-sm py-2 ps-4 pe-2 text-sm outline-none select-none
                            hover:bg-slate-300/20`,
                          isSelected && 'border-primary bg-accent hover:bg-accent border'
                        )}>
                        <div className="flex flex-1 flex-col truncate">
                          <span className="truncate font-medium">{campaign.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
