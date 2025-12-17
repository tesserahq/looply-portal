import { useApp } from '@/context/AppContext'
import useDebounce from '@/hooks/useDebounce'
import { NodeENVType } from '@/libraries/fetch'
import { Button } from '@/modules/shadcn/ui/button'
import { Dialog, DialogContent } from '@/modules/shadcn/ui/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shadcn/ui/form'
import { Input } from '@/modules/shadcn/ui/input'
import { useContacts } from '@/resources/hooks/contacts'
import { cn } from '@/utils/misc'
import { type DialogProps } from '@radix-ui/react-dialog'
import { ChevronsUpDownIcon, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext } from './form-context'

interface ContactSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  apiUrl: string
  nodeEnv: NodeENVType
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  isLoading?: boolean
  disabled?: boolean
  dialogProps?: DialogProps
}

const ContactSelect = ({
  value,
  onChange,
  apiUrl,
  nodeEnv,
  placeholder = 'Select a contact',
  searchPlaceholder = 'Search contacts...',
  emptyText = 'No contacts found.',
  isLoading: externalLoading = false,
  disabled = false,
  dialogProps,
}: ContactSelectProps) => {
  const { token } = useApp()
  const [open, setOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search query - only trigger API call when search is >= 3 characters
  useDebounce(
    () => {
      if (contactSearch.length >= 3) {
        setDebouncedSearch(contactSearch)
      } else {
        // Clear search query if less than 3 characters
        setDebouncedSearch('')
      }
    },
    [contactSearch],
    500
  )

  // Get contacts with search query if >= 3 characters
  // Only fetch when dialog is open
  const { data: contacts, isLoading: isLoadingContacts } = useContacts(
    { apiUrl, token: token!, nodeEnv },
    {
      page: 1,
      size: 25,
      ...(debouncedSearch.length >= 3 && { q: debouncedSearch }),
    },
    {
      enabled: open || value !== '', // Only fetch when dialog is open or value is set
    }
  )

  const isLoading = externalLoading || isLoadingContacts

  // Transform contacts to options
  const contactOptions = useMemo(() => {
    return (
      contacts?.items.map((contact) => ({
        id: contact.id,
        email: contact.email,
        name: `${contact.first_name} ${contact.last_name}`.trim() || contact.email,
        searchValue: `${contact.email} ${contact.first_name} ${contact.last_name}`.trim(),
      })) || []
    )
  }, [contacts])

  const selectedContact = contactOptions.find((contact) => contact.id === value)

  const handleSelect = (contactId: string) => {
    onChange(contactId === value ? undefined : contactId)
    setOpen(false)
  }

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!contactSearch || contactSearch.length < 3) {
      return contactOptions
    }
    const searchLower = contactSearch.toLowerCase()
    return contactOptions.filter(
      (contact) =>
        contact.email.toLowerCase().includes(searchLower) ||
        contact.name.toLowerCase().includes(searchLower) ||
        contact.searchValue.toLowerCase().includes(searchLower)
    )
  }, [contactOptions, contactSearch])

  const handleSearchChange = (search: string) => {
    setContactSearch(search)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    // Reset search when dialog closes
    if (!isOpen) {
      setContactSearch('')
      setDebouncedSearch('')
    }
  }

  // Autofocus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure dialog is fully rendered
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
        ) : selectedContact ? (
          <div className="truncate">
            <span className="truncate font-medium">{selectedContact.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange} {...dialogProps}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <div className="flex h-full flex-col">
            {/* Search Input */}
            <div className="flex items-center border-b px-3">
              <Search className="mr-1 h-4 w-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={contactSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-12 border-0 bg-transparent outline-none focus-visible:ring-0
                  focus-visible:ring-offset-0"
                autoFocus
              />
            </div>

            {/* Contacts List */}
            <div className="max-h-[300px] overflow-x-hidden overflow-y-auto p-1">
              {isLoadingContacts || isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={30} className="shrink-0 animate-spin opacity-50" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-muted-foreground py-6 text-center text-sm">{emptyText}</div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => {
                    const isSelected = value === contact.id

                    return (
                      <div
                        key={contact.id}
                        onClick={() => handleSelect(contact.id)}
                        className={cn(
                          `dark:hover:bg-navy-300/20 relative flex cursor-pointer items-center gap-2
                            rounded-sm py-2 ps-4 pe-2 text-sm outline-none select-none
                            hover:bg-slate-300/20`,
                          isSelected && 'border-primary bg-accent hover:bg-accent border'
                        )}>
                        <div className="flex flex-1 flex-col truncate">
                          <span className="truncate font-medium">{contact.email}</span>
                          {contact.name !== contact.email && (
                            <span className="text-muted-foreground truncate text-xs">
                              {contact.name}
                            </span>
                          )}
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

interface FormContactsProps extends DialogProps {
  field: string
  apiUrl: string
  nodeEnv: NodeENVType
  label?: string
  description?: string
  required?: boolean
  hideError?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  isLoading?: boolean
  rules?: {
    required?: boolean | string
    validate?: (value: unknown) => boolean | string | Promise<boolean | string>
  }
}

export const FormContacts = ({
  field,
  apiUrl,
  nodeEnv,
  label,
  description,
  required,
  hideError = false,
  placeholder = 'Select a contact',
  searchPlaceholder = 'Search contacts...',
  emptyText = 'No contacts found.',
  isLoading = false,
  rules,
  ...dialogProps
}: FormContactsProps) => {
  const { form } = useFormContext()

  return (
    <FormField
      control={form.control}
      name={field}
      rules={{
        ...rules,
        ...(required && {
          required: required === true ? 'This field is required' : required,
        }),
      }}
      render={({ field: fieldProps }) => (
        <FormItem>
          {label && (
            <FormLabel
              className={required ? 'after:text-destructive after:ml-0.5 after:content-["*"]' : ''}>
              {label}
            </FormLabel>
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <ContactSelect
              value={fieldProps.value}
              onChange={fieldProps.onChange}
              apiUrl={apiUrl}
              nodeEnv={nodeEnv}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              emptyText={emptyText}
              isLoading={isLoading}
              dialogProps={dialogProps}
            />
          </FormControl>
          {!hideError && <FormMessage />}
        </FormItem>
      )}
    />
  )
}
