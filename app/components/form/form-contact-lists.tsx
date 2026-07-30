import { useApp } from 'tessera-ui'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { Dialog, DialogContent } from '@/modules/shadcn/ui/dialog'
import { Input } from '@/modules/shadcn/ui/input'
import { useContactLists } from '@/resources/hooks/contact-lists'
import { cn } from '@shadcn/lib/utils'
import { type DialogProps } from '@radix-ui/react-dialog'
import { ChevronsUpDownIcon, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export interface ContactListOption {
  id: string
  name: string
  contactCount?: number
}

export interface ContactListSelectProps {
  value?: string
  onChange: (contactList: ContactListOption | undefined) => void
  apiUrl: string
  nodeEnv: NodeENVType
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  isLoading?: boolean
  disabled?: boolean
  dialogProps?: DialogProps
}

export const ContactListSelect = ({
  value,
  onChange,
  apiUrl,
  nodeEnv,
  placeholder = 'Select a contact list',
  searchPlaceholder = 'Search contact lists...',
  emptyText = 'No contact lists found.',
  isLoading: externalLoading = false,
  disabled = false,
  dialogProps,
}: ContactListSelectProps) => {
  const { token } = useApp()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: contactLists, isLoading: isLoadingContactLists } = useContactLists(
    { apiUrl, token: token!, nodeEnv },
    { page: 1, size: 100 },
    {
      enabled: open || value !== '',
    }
  )

  const isLoading = externalLoading || isLoadingContactLists

  const contactListOptions = useMemo(() => {
    return (
      contactLists?.items.map((contactList) => ({
        id: contactList.id,
        name: contactList.name,
        contactCount: contactList.contact_count,
      })) || []
    )
  }, [contactLists])

  const selectedContactList = contactListOptions.find((contactList) => contactList.id === value)

  // Keeps the parent's copy of the selected contact list (name, contactCount)
  // in sync with what this component fetched — covers both the initial
  // hydration (parent only knows the id from `value`) and background
  // refetches that change the count, without the parent re-fetching itself.
  useEffect(() => {
    if (value && selectedContactList) {
      onChange(selectedContactList)
    }
  }, [value, selectedContactList?.id, selectedContactList?.name, selectedContactList?.contactCount])

  const handleSelect = (contactListId: string) => {
    if (contactListId === value) {
      onChange(undefined)
    } else {
      onChange(contactListOptions.find((contactList) => contactList.id === contactListId))
    }
    setOpen(false)
  }

  const filteredContactLists = useMemo(() => {
    if (!search) {
      return contactListOptions
    }
    const searchLower = search.toLowerCase()
    return contactListOptions.filter((contactList) =>
      contactList.name.toLowerCase().includes(searchLower)
    )
  }, [contactListOptions, search])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSearch('')
    }
  }

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
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
        ) : selectedContactList ? (
          <div className="truncate">
            <span className="truncate font-medium">
              {selectedContactList.name}
              {typeof selectedContactList.contactCount === 'number' &&
                ` (${selectedContactList.contactCount.toLocaleString()})`}
            </span>
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
              ) : filteredContactLists.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {filteredContactLists.map((contactList) => {
                    const isSelected = value === contactList.id

                    return (
                      <div
                        key={contactList.id}
                        onClick={() => handleSelect(contactList.id)}
                        className={cn(
                          `dark:hover:bg-navy-300/20 relative flex cursor-pointer items-center gap-2
                            rounded-sm py-2 ps-4 pe-2 text-sm outline-none select-none
                            hover:bg-slate-300/20`,
                          isSelected && 'border-primary bg-accent hover:bg-accent border'
                        )}>
                        <div className="flex flex-1 flex-col truncate">
                          <span className="truncate font-medium">
                            {contactList.name}
                            {typeof contactList.contactCount === 'number' &&
                              ` (${contactList.contactCount.toLocaleString()})`}
                          </span>
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
