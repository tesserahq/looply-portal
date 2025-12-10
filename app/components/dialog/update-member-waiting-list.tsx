/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContactType } from '@/resources/queries/contacts'
import { WaitingListStatusType } from '@/resources/queries/waiting-lists'
import { Button } from '@shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Label } from '@shadcn/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@shadcn/ui/select'
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'

interface FuncProps {
  onOpen: (contact: ContactType, status: string) => void
  onOpenBulk: (contacts: ContactType[], status?: string) => void
  onClose: () => void
}

interface IProps {
  onUpdateStatus: (contactId: string, status: string) => Promise<void>
  onBulkUpdateStatus: (contactIds: string[], status: string) => Promise<void>
  memberStatuses: WaitingListStatusType[]
}

const UpdateMemberWaitingListStatus: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { onUpdateStatus, onBulkUpdateStatus, memberStatuses }: IProps,
  ref,
) => {
  const [open, setOpen] = useState<boolean>(false)
  const [memberStatus, setMemberStatus] = useState<string>('')
  const [contact, setContact] = useState<ContactType>()
  const [contacts, setContacts] = useState<ContactType[]>([])
  const [isBulk, setIsBulk] = useState<boolean>(false)

  useImperativeHandle(ref, () => ({
    onOpen(contact: ContactType, status: string) {
      setOpen(true)
      setContact(contact)
      setContacts([])
      setMemberStatus(status)
      setIsBulk(false)
    },
    onOpenBulk(selectedContacts: ContactType[], status?: string) {
      setOpen(true)
      setContact(undefined)
      setContacts(selectedContacts)
      setMemberStatus(status || '')
      setIsBulk(true)
    },
    onClose() {
      setOpen(false)
    },
  }))

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const onSave = async () => {
    if (!memberStatus) return

    setIsSubmitting(true)
    try {
      if (isBulk && contacts.length > 0) {
        await onBulkUpdateStatus(
          contacts.map((c) => c.id),
          memberStatus,
        )
      } else if (contact) {
        await onUpdateStatus(contact.id, memberStatus)
      }
      setMemberStatus('')
      setContact(undefined)
      setContacts([])
      setIsBulk(false)
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const onCloseDialog = () => {
    setOpen(false)
  }

  const selectedEmails = useMemo(() => {
    if (isBulk && contacts.length > 0) {
      return contacts.map((c) => c.email).filter(Boolean)
    }
    if (contact?.email) {
      return [contact.email]
    }
    return []
  }, [isBulk, contacts, contact])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh]">
        {/* HEADER */}
        <DialogHeader>
          <DialogTitle className="mb-2">
            {isBulk ? 'Update Members Status' : 'Update Member Status'}
          </DialogTitle>
          <DialogDescription>
            {isBulk ? (
              <div className="space-y-2">
                <p>
                  Update the status of <b>{contacts.length}</b> selected member
                  {contacts.length > 1 ? 's' : ''}
                </p>
                {selectedEmails.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto rounded-md border border-border bg-muted/50 p-2">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      Selected Members:
                    </p>
                    <ul className="space-y-1 text-xs">
                      {selectedEmails.slice(0, 10).map((email, index) => (
                        <li key={index} className="truncate text-left">
                          {email}
                        </li>
                      ))}
                      {selectedEmails.length > 10 && (
                        <li className="text-muted-foreground">
                          ... and {selectedEmails.length - 10} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>
                Update the status of the member <b>{contact?.email}</b>
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <Label>Status</Label>
          <Select value={memberStatus} onValueChange={setMemberStatus}>
            <SelectTrigger className="bg-card">
              <span className="capitalize">
                {memberStatus ||
                  (memberStatuses.length > 0 ? 'Select status' : 'No statuses available')}
              </span>
            </SelectTrigger>
            <SelectContent>
              {memberStatuses.map((status) => {
                return (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex flex-col items-start">
                      <p>{status.label}</p>
                      <span className="text-xs text-muted-foreground">
                        {status.description}
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* FOOTER */}
        <DialogFooter className="flex w-full items-center !justify-end">
          <Button variant="outline" onClick={onCloseDialog}>
            Cancel
          </Button>
          <Button disabled={isSubmitting || !memberStatus} onClick={onSave}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default forwardRef(UpdateMemberWaitingListStatus)
