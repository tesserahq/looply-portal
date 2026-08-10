import { NodeENVType } from '@/libraries/fetch'
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
import { useCreateTemplate, useTemplates } from '@/resources/hooks/templates'
import { generateTemplateAlias } from '@/utils/helpers/slug.helper'
import { FilePlus2, LayoutTemplate, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

type CampaignSource = 'new' | 'template'

interface NewCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiUrl: string
  sendlyApiUrl: string
  nodeEnv: NodeENVType
}

export function NewCampaignModal({
  open,
  onOpenChange,
  apiUrl,
  sendlyApiUrl,
  nodeEnv,
}: NewCampaignModalProps) {
  const navigate = useNavigate()
  const { token } = useApp()
  const [source, setSource] = useState<CampaignSource>('new')
  const [templateId, setTemplateId] = useState<string>('')

  const sendlyConfig = { apiUrl: sendlyApiUrl, token: token!, nodeEnv }

  const {
    data: templates,
    isLoading: isLoadingTemplates,
    isError: isTemplatesError,
  } = useTemplates(sendlyConfig, { page: 1, size: 100 }, { enabled: open })

  const { mutateAsync: createTemplate, isPending } = useCreateTemplate(sendlyConfig)

  const sortedTemplates = useMemo(
    () => [...(templates?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [templates]
  )

  const selectedTemplate = useMemo(
    () => sortedTemplates.find((template) => template.id === templateId),
    [sortedTemplates, templateId]
  )

  const canContinue = source === 'new' || !!selectedTemplate

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setSource('new')
      setTemplateId('')
    }
  }

  const handleContinue = async () => {
    if (source === 'template') {
      if (!selectedTemplate) return
      handleOpenChange(false)
      navigate(`/campaigns/new?template_id=${selectedTemplate.id}&source=template`)
      return
    }

    const created = await createTemplate({
      alias: generateTemplateAlias('template'),
      name: '',
      subject: '',
      html: '',
    })
    handleOpenChange(false)
    navigate(`/campaigns/new?template_id=${created.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Start from scratch or pre-fill your email from a saved template.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSource('new')}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors cursor-pointer',
              source === 'new' ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
            )}>
            <div className="bg-muted mb-3 flex h-9 w-9 items-center justify-center rounded-lg">
              <FilePlus2 size={18} />
            </div>
            <div className="font-medium">Create new</div>
            <div className="text-muted-foreground text-sm">Begin with a blank email.</div>
          </button>

          <button
            type="button"
            onClick={() => setSource('template')}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors cursor-pointer',
              source === 'template'
                ? 'border-primary bg-accent'
                : 'border-border hover:bg-accent/50'
            )}>
            <div
              className="bg-primary text-primary-foreground mb-3 flex h-9 w-9 items-center
                justify-center rounded-lg">
              <LayoutTemplate size={18} />
            </div>
            <div className="font-medium">Use existing template</div>
            <div className="text-muted-foreground text-sm">Start from a saved layout.</div>
          </button>
        </div>

        {source === 'template' && (
          <div className="mt-2">
            <label className="mb-1.5 block text-sm font-medium">Template</label>
            {isTemplatesError ? (
              <p className="text-destructive text-sm">
                Couldn&apos;t load templates. You may not have access to them.
              </p>
            ) : (
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  {isLoadingTemplates ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Choose a template" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {sortedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
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
                Creating...
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
