import { Button } from '@shadcn/ui/button'
import { Checkbox } from '@shadcn/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@shadcn/ui/input-group'
import { Label } from '@shadcn/ui/label'
import { useApp } from 'tessera-ui'
import useDebounce from '@/hooks/useDebounce'
import { useContacts } from '@/resources/hooks/contacts'
import { NodeENVType } from '@/libraries/fetch'
import { Link, useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppPreloader } from '../loader/pre-loader'

const SEARCH_MIN_CHARS = 3
const SEARCH_DEBOUNCE_MS = 500
const DEFAULT_PAGE_SIZE = 15
const SEARCH_PAGE_SIZE = 25

interface ContactMultiSelectProps {
  apiUrl: string
  nodeEnv: NodeENVType
  open: boolean
  selectedIds: string[]
  onChange: (contactIds: string[]) => void
}

export function ContactMultiSelect({
  apiUrl,
  nodeEnv,
  open,
  selectedIds,
  onChange,
}: ContactMultiSelectProps) {
  const navigate = useNavigate()
  const { token } = useApp()
  const [search, setSearch] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  // /contacts/search needs a fairly complete term to match, so only fire it
  // once the user has typed enough characters - a shorter query just falls
  // back to the default (unfiltered) view below.
  useDebounce(
    () => {
      const trimmed = search.trim()
      setDebouncedSearch(trimmed.length >= SEARCH_MIN_CHARS ? trimmed : '')
    },
    [search],
    SEARCH_DEBOUNCE_MS
  )

  const hasSearchQuery = debouncedSearch !== ''

  const { data: contacts, isLoading } = useContacts(
    { apiUrl, token: token!, nodeEnv },
    {
      page: 1,
      size: hasSearchQuery ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE,
      q: hasSearchQuery ? debouncedSearch : undefined,
    },
    { enabled: open && !!token }
  )

  const hasData = useMemo(() => !!contacts?.items?.length, [contacts])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <InputGroup className="animate-slide-up dark:bg-card w-full shrink-0 bg-white">
        <InputGroupInput
          placeholder="Search members"
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

      {isLoading ? (
        <AppPreloader className="h-auto" />
      ) : (
        <div className="animate-slide-up flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {!hasData && !search && (
            <div className="flex h-48 flex-col items-center justify-center">
              <h1 className="dark:text-foreground text-xl font-semibold">No members found</h1>
              <p className="dark:text-foreground mt-1 text-sm opacity-70">
                Get started by creating your first contact
              </p>
              <Button variant="black" onClick={() => navigate('/contacts/new')} className="mt-3">
                New Contact
              </Button>
            </div>
          )}
          {!hasData && search && (
            <div className="flex h-48 flex-col items-center justify-center">
              <h1 className="dark:text-foreground text-xl font-semibold">No contacts found</h1>
              <p className="dark:text-foreground mt-1 text-sm opacity-70">
                Try adjusting your search criteria
              </p>
            </div>
          )}
          {hasData &&
            contacts?.items.map((contact) => {
              const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ')
              const isChecked = selectedIds.includes(contact.id)

              return (
                <Label
                  key={contact.id}
                  className="bg-card hover:bg-accent/50 mb-1 flex items-start gap-3 rounded-lg
                    border p-3 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50
                    dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950">
                  <Checkbox
                    id="tools"
                    value={contact.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const nextIds = checked
                        ? [...selectedIds, contact.id]
                        : selectedIds.filter((id) => id !== contact.id)

                      onChange(nextIds)
                    }}
                    className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600
                      data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700
                      dark:data-[state=checked]:bg-blue-700"
                  />
                  <div>
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="button-link text-xs leading-none">
                      {contact.email}
                    </Link>
                    <div className="mt-1 flex items-center gap-1">
                      {fullName && <p className="text-muted-foreground text-xs">{fullName} | </p>}
                      {contact.phone && (
                        <p className="text-muted-foreground text-xs">{contact.phone}</p>
                      )}
                    </div>
                  </div>
                </Label>
              )
            })}
        </div>
      )}
    </div>
  )
}
