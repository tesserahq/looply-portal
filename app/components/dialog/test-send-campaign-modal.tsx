import { Button } from '@shadcn/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@shadcn/ui/input-group'
import { cn } from '@shadcn/lib/utils'
import { useApp } from 'tessera-ui'
import useDebounce from '@/hooks/useDebounce'
import { NodeENVType } from '@/libraries/fetch'
import { useSendTestCampaign } from '@/resources/hooks/campaigns'
import { useContacts } from '@/resources/hooks/contacts'
import { ContactType } from '@/resources/queries/contacts'
import { Loader2, Search, X } from 'lucide-react'
import { useState } from 'react'

const SEARCH_MIN_CHARS = 3
const SEARCH_DEBOUNCE_MS = 500
const PAGE_SIZE = 25

interface TestSendCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiUrl: string
  nodeEnv: NodeENVType
  campaignId: string
}

export function TestSendCampaignModal({
  open,
  onOpenChange,
  apiUrl,
  nodeEnv,
  campaignId,
}: TestSendCampaignModalProps) {
  const { token } = useApp()
  const [search, setSearch] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [selectedContact, setSelectedContact] = useState<ContactType | null>(null)

  // Same search convention as the contact member picker: the full-text search
  // needs a fairly complete term, so a shorter query shows the unfiltered list.
  useDebounce(
    () => {
      const trimmed = search.trim()
      setDebouncedSearch(trimmed.length >= SEARCH_MIN_CHARS ? trimmed : '')
    },
    [search],
    SEARCH_DEBOUNCE_MS
  )

  // Only active contacts can be sent to (the API rejects the rest), and a
  // contact without an email has nowhere to receive the test.
  const { data: contacts, isLoading } = useContacts(
    { apiUrl, token: token!, nodeEnv },
    {
      page: 1,
      size: PAGE_SIZE,
      q: debouncedSearch || undefined,
      status: 'active',
    },
    { enabled: open && !!token }
  )

  const selectableContacts = contacts?.items.filter((contact) => !!contact.email) ?? []

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearch('')
      setDebouncedSearch('')
      setSelectedContact(null)
    }
    onOpenChange(nextOpen)
  }

  const { mutate: sendTestCampaign, isPending } = useSendTestCampaign(
    { apiUrl, token: token!, nodeEnv },
    {
      onSuccess: () => handleOpenChange(false),
    }
  )

  const handleSend = () => {
    if (!selectedContact) return

    sendTestCampaign({ campaignId, contactId: selectedContact.id })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send test email</DialogTitle>
          <DialogDescription>
            Pick a contact to receive a one-off test of this campaign. Nothing else is sent, and the
            campaign stays a draft.
          </DialogDescription>
        </DialogHeader>

        <InputGroup className="w-full">
          <InputGroupInput
            placeholder="Search contacts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          {search && (
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-transparent"
                onClick={() => setSearch('')}>
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="flex max-h-72 min-h-0 flex-col gap-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : selectableContacts.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No active contacts with an email found.
            </p>
          ) : (
            selectableContacts.map((contact) => {
              const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
              const isSelected = selectedContact?.id === contact.id

              return (
                <button
                  key={contact.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    `bg-card hover:bg-accent/50 flex flex-col items-start rounded-lg border p-3
                      text-left`,
                    isSelected && 'border-primary bg-primary/10'
                  )}>
                  <span className="text-sm">{contact.email}</span>
                  {fullName && <span className="text-muted-foreground text-xs">{fullName}</span>}
                </button>
              )
            })
          )}
        </div>

        {selectedContact && (
          <p className="text-muted-foreground text-sm">
            Sending test to{' '}
            <span className="text-foreground font-medium">{selectedContact.email}</span>
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={!selectedContact || isPending} onClick={handleSend}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send test'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
