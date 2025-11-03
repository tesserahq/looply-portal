/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useApp } from '@/context/AppContext'
import { IContact } from '@/types/contact'
import { IWaitingListStatus } from '@/types/waiting-list'
import { FetcherWithComponents, useParams } from '@remix-run/react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'

interface FuncProps {
  onOpen: (contact: IContact, status: string) => void
  onOpenBulk: (contacts: IContact[], status?: string) => void
  onClose: () => void
}

interface IProps {
  fetcher: FetcherWithComponents<unknown>
  memberStatuses: IWaitingListStatus[]
}

const UpdateMemberWaitingListStatus: React.ForwardRefRenderFunction<FuncProps, IProps> = (
  { fetcher, memberStatuses }: IProps,
  ref,
) => {
  const params = useParams()
  const { token } = useApp()
  const [open, setOpen] = useState<boolean>(false)
  const [memberStatus, setMemberStatus] = useState<string>('')
  const [contact, setContact] = useState<IContact>()
  const [contacts, setContacts] = useState<IContact[]>([])
  const [isBulk, setIsBulk] = useState<boolean>(false)

  useImperativeHandle(ref, () => ({
    onOpen(contact: IContact, status: string) {
      setOpen(true)
      setContact(contact)
      setContacts([])
      setMemberStatus(status)
      setIsBulk(false)
    },
    onOpenBulk(selectedContacts: IContact[], status?: string) {
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

  const isSubmitting = useMemo(() => fetcher.state === 'submitting', [fetcher.state])

  const onSave = async () => {
    if (params.id && token) {
      const formData = new FormData()

      if (isBulk && contacts.length > 0) {
        formData.append('intent', 'update_member_waiting_list_status_bulk')
        formData.append('waiting_list_id', params?.id || '')
        formData.append('status', memberStatus)
        formData.append('contact_ids', JSON.stringify(contacts.map((c) => c.id)))
      } else if (contact) {
        formData.append('intent', 'update_member_waiting_list_status')
        formData.append('waiting_list_id', params?.id || '')
        formData.append('status', memberStatus)
        formData.append('contact_id', contact.id)
      }

      formData.append('token', token!)

      fetcher.submit(formData, {
        method: 'POST',
      })
    }
  }

  const onCloseDialog = () => {
    setOpen(false)
  }

  useEffect(() => {
    if (fetcher.state === 'idle' && !open) {
      setMemberStatus('')
      setContact(undefined)
      setContacts([])
      setIsBulk(false)
    }
  }, [fetcher.state, open])

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
