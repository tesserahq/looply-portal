import { NodeENVType } from '@/libraries/fetch'
import { useCloneEventMapping } from '@/resources/hooks/event-mappings'
import { EventMappingType } from '@/resources/queries/event-mappings'
import { Button } from '@shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Input } from '@shadcn/ui/input'
import { Label } from '@shadcn/ui/label'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CloneEventMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiUrl: string
  nodeEnv: NodeENVType
  token: string
  sourceEventMapping: EventMappingType
  onCloned?: (clone: EventMappingType) => void
}

/**
 * Prompts for only a new event_type - everything else (source, identity
 * configuration, defaults, and every active field mapping) is copied verbatim
 * from sourceEventMapping by the backend, so there's nothing else to review here.
 */
export const CloneEventMappingDialog = ({
  open,
  onOpenChange,
  apiUrl,
  nodeEnv,
  token,
  sourceEventMapping,
  onCloned,
}: CloneEventMappingDialogProps) => {
  const config = { apiUrl, nodeEnv, token }
  const [eventType, setEventType] = useState('')

  const { mutateAsync: cloneEventMapping, isPending } = useCloneEventMapping(config, {
    onSuccess: (clone) => {
      onOpenChange(false)
      onCloned?.(clone)
    },
  })

  useEffect(() => {
    if (!open) return
    setEventType('')
  }, [open])

  const handleSubmit = async () => {
    if (!eventType.trim()) return
    await cloneEventMapping({ id: sourceEventMapping.id, data: { event_type: eventType.trim() } })
  }

  const canSubmit = eventType.trim().length > 0 && !isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Event Mapping</DialogTitle>
          <DialogDescription>
            Copies &quot;{sourceEventMapping.event_type}&quot;&apos;s source, identity
            configuration, defaults, and field mappings onto a new event_type. Review the field
            mappings afterward if the new event&apos;s payload differs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="clone-event-type">New Event Type</Label>
          <Input
            id="clone-event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="com.mylinden.person.updated"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              'Clone'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
