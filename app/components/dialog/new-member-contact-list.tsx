import { Button } from '@shadcn/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shadcn/ui/dialog'
import { forwardRef, useImperativeHandle, useState } from 'react'
import { NodeENVType } from '@/libraries/fetch'
import { ContactMultiSelect } from './contact-multi-select'

interface FuncProps {
  onOpen: () => void
  onClose: () => void
}

interface IProps {
  onAddMembers: (contactIds: string[]) => Promise<void>
  apiUrl: string
  nodeEnv: NodeENVType
}

const NewMemberContactList: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { onAddMembers, apiUrl, nodeEnv }: IProps,
  ref
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [contactIds, setContactIds] = useState<string[]>([])

  useImperativeHandle(ref, () => ({
    onOpen() {
      setOpen(true)
    },
    onClose() {
      setOpen(false)
      setContactIds([])
    },
  }))

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const onSave = async () => {
    if (contactIds.length === 0) return

    setIsSubmitting(true)
    try {
      await onAddMembers(contactIds)
      setContactIds([])
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

        {/* BODY */}
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
            <Button disabled={isSubmitting || contactIds.length === 0} onClick={onSave}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(NewMemberContactList)
