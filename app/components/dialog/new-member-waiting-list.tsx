import { Button } from '@shadcn/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shadcn/ui/dialog'
import { Label } from '@shadcn/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@shadcn/ui/select'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { cn } from '@shadcn/lib/utils'
import { NodeENVType } from '@/libraries/fetch'
import { WaitingListStatusType } from '@/resources/queries/waiting-lists/waiting-list-member.type'
import { ContactMultiSelect } from './contact-multi-select'

interface FuncProps {
  onOpen: () => void
  onClose: () => void
}

interface IProps {
  onAddMembers: (contactIds: string[], status?: string) => Promise<void>
  memberStatuses: WaitingListStatusType[]
  apiUrl: string
  nodeEnv: NodeENVType
}

const NewMemberWaitingList: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { onAddMembers, memberStatuses, apiUrl, nodeEnv }: IProps,
  ref
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [contactIds, setContactIds] = useState<string[]>([])
  const [memberStatus, setMemberStatus] = useState<string>('')

  useImperativeHandle(ref, () => ({
    onOpen() {
      setOpen(true)
    },
    onClose() {
      setOpen(false)
      setContactIds([])
      setMemberStatus('')
    },
  }))

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const onSave = async () => {
    if (contactIds.length === 0) return

    setIsSubmitting(true)
    try {
      await onAddMembers(contactIds, memberStatus || undefined)
      setContactIds([])
      setMemberStatus('')
    } catch {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const onCloseDialog = () => {
    setOpen(false)
    setContactIds([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="shrink-0">
          <DialogTitle className="mb-2">New Member</DialogTitle>
        </DialogHeader>
        <div className="mb-3 shrink-0">
          <Label className="mb-3">Status</Label>
          <Select value={memberStatus} onValueChange={setMemberStatus}>
            <SelectTrigger className="bg-card">
              <span
                className={cn(
                  'capitalize',
                  !memberStatus && 'text-muted-foreground normal-case opacity-50'
                )}>
                {memberStatus || 'Select status'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {memberStatuses.map((status) => {
                return (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-start">
                        <p>{status.label}</p>
                        <span className="text-muted-foreground text-xs">{status.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* BODY */}
        <Label className="mb-0 shrink-0">Members</Label>
        <ContactMultiSelect
          key={String(open)}
          apiUrl={apiUrl}
          nodeEnv={nodeEnv}
          open={open}
          selectedIds={contactIds}
          onChange={setContactIds}
        />

        {/* FOOTER */}
        <DialogFooter className="flex w-full shrink-0 items-center justify-between!">
          <div>{contactIds.length > 0 && <span>{contactIds.length} Selected</span>}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCloseDialog}>
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || contactIds.length === 0 || !memberStatus}
              onClick={onSave}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(NewMemberWaitingList)
